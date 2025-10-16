using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StandManager.Application.Common.Errors;
using StandManager.Application.Common.Results;
using StandManager.Application.Orders.Models;
using StandManager.Data;
using StandManager.Entities;

namespace StandManager.Application.Orders.Services;

public sealed class OrderService : IOrderService
{
    private readonly StandManagerDbContext _dbContext;
    private readonly IOrderWorkflowService _orderWorkflowService;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        StandManagerDbContext dbContext,
        IOrderWorkflowService orderWorkflowService,
        ILogger<OrderService> logger)
    {
        _dbContext = dbContext;
        _orderWorkflowService = orderWorkflowService;
        _logger = logger;
    }

    public async Task<OperationResult<OrderCreationResult>> CreateOrderAsync(
        string customerName,
        Guid? customerSessionId,
        IReadOnlyCollection<OrderItemRequestModel> items,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0)
        {
            return OperationResult<OrderCreationResult>.Failure(new OperationError(ErrorCodes.OrderMustHaveItems, "Items"));
        }

        var normalizedName = customerName.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName))
        {
            return OperationResult<OrderCreationResult>.Failure(new OperationError(ErrorCodes.CustomerNameRequired, "CustomerName"));
        }

        var groupedItems = items
            .GroupBy(item => item.PastelFlavorId)
            .Select(group => new
            {
                FlavorId = group.Key,
                Quantity = group.Sum(g => g.Quantity),
                Items = group.ToList()
            })
            .ToList();

        var flavorIds = groupedItems.Select(group => group.FlavorId).ToList();
        var flavors = await _dbContext.PastelFlavors
            .Where(flavor => flavorIds.Contains(flavor.Id))
            .ToDictionaryAsync(flavor => flavor.Id, cancellationToken);

        if (flavors.Count != flavorIds.Count)
        {
            return OperationResult<OrderCreationResult>.Failure(new OperationError(ErrorCodes.FlavorNotFound, "Items"));
        }

        var stockErrors = new List<OperationError>();
        foreach (var group in groupedItems)
        {
            var flavor = flavors[group.FlavorId];
            if (flavor.AvailableQuantity < group.Quantity)
            {
                stockErrors.Add(new OperationError(ErrorCodes.FlavorOutOfStock, "Items", flavor.Name));
            }
        }

        if (stockErrors.Count > 0)
        {
            return OperationResult<OrderCreationResult>.Failure(stockErrors);
        }

        CustomerSession? session = null;
        if (customerSessionId.HasValue)
        {
            session = await _dbContext.CustomerSessions
                .FirstOrDefaultAsync(s => s.Id == customerSessionId.Value, cancellationToken);

            if (session is null)
            {
                return OperationResult<OrderCreationResult>.Failure(new OperationError(ErrorCodes.CustomerSessionNotFound, "CustomerSessionId"));
            }
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (session is null)
        {
            session = new CustomerSession
            {
                DisplayName = normalizedName
            };

            _dbContext.CustomerSessions.Add(session);
        }
        else if (!string.Equals(session.DisplayName, normalizedName, StringComparison.Ordinal))
        {
            session.DisplayName = normalizedName;
        }

        var order = new Order
        {
            CustomerSession = session,
            CustomerNameSnapshot = normalizedName
        };

        var now = DateTimeOffset.UtcNow;
        decimal totalAmount = 0m;

        foreach (var group in groupedItems)
        {
            var flavor = flavors[group.FlavorId];
            flavor.AvailableQuantity -= group.Quantity;
            totalAmount += flavor.Price * group.Quantity;

            foreach (var item in group.Items)
            {
                var normalizedNotes = item.Notes?.Trim();

                for (var index = 0; index < item.Quantity; index++)
                {
                    order.Items.Add(new OrderItem
                    {
                        PastelFlavorId = item.PastelFlavorId,
                        Quantity = 1,
                        Notes = normalizedNotes,
                        UnitPrice = flavor.Price,
                        StatusHistory =
                        {
                            new OrderItemStatusHistory
                            {
                                Status = OrderItemStatus.Pending,
                                ChangedAt = now
                            }
                        }
                    });
                }
            }
        }

        order.TotalAmount = totalAmount;

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation("Order {OrderId} created for session {SessionId} ({CustomerName})", order.Id, session.Id, session.DisplayName);

        var result = new OrderCreationResult(
            order.Id,
            session.Id,
            order.TotalAmount,
            order.Items
                .Select(item => new OrderItemSummaryModel(
                    item.Id,
                    item.PastelFlavorId,
                    item.Quantity,
                    NormalizeStatus(item.Status),
                    item.UnitPrice))
                .ToList());

        return OperationResult<OrderCreationResult>.Success(result);
    }

    public async Task<IReadOnlyCollection<ActiveOrderGroupModel>> GetActiveOrdersAsync(CancellationToken cancellationToken)
    {
        var orders = await _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.Items.Any(item =>
                item.Status != OrderItemStatus.Completed &&
                item.Status != OrderItemStatus.Cancelled &&
                item.Status != OrderItemStatus.OutForDelivery))
            .Select(order => new
            {
                order.Id,
                order.CustomerSessionId,
                CustomerName = order.CustomerSession.DisplayName,
                order.CreatedAt,
                order.TotalAmount,
                Items = order.Items
                    .Where(item =>
                        item.Status != OrderItemStatus.Completed &&
                        item.Status != OrderItemStatus.Cancelled &&
                        item.Status != OrderItemStatus.OutForDelivery)
                    .OrderBy(item => item.CreatedAt)
                    .Select(item => new
                    {
                        item.Id,
                        item.PastelFlavorId,
                        FlavorName = item.PastelFlavor.Name,
                        item.Quantity,
                        item.UnitPrice,
                        item.Status,
                        item.CreatedAt,
                        item.LastUpdatedAt
                    })
                    .ToList()
            })
            .OrderBy(order => order.CreatedAt)
            .ToListAsync(cancellationToken);

        var grouped = orders
            .GroupBy(order => new { order.CustomerSessionId, order.CustomerName })
            .Select(group => new ActiveOrderGroupModel(
                group.Key.CustomerSessionId,
                group.Key.CustomerName,
                group.Select(order => new ActiveOrderModel(
                    order.Id,
                    order.CreatedAt,
                    order.TotalAmount,
                    order.Items.Select(item => new ActiveOrderItemModel(
                        item.Id,
                        item.PastelFlavorId,
                        item.FlavorName,
                        item.Quantity,
                        item.UnitPrice,
                        NormalizeStatus(item.Status),
                        item.CreatedAt,
                        item.LastUpdatedAt
                    )).ToList()
                )).ToList()
            ))
            .ToList();

        return grouped;
    }

    public async Task<OperationResult<ActiveOrderItemModel>> AdvanceOrderItemStatusAsync(
        int orderId,
        Guid orderItemId,
        OrderItemStatus? targetStatus,
        CancellationToken cancellationToken)
    {
        var item = await _dbContext.OrderItems
            .Include(orderItem => orderItem.Order)
                .ThenInclude(order => order.CustomerSession)
            .Include(orderItem => orderItem.PastelFlavor)
            .FirstOrDefaultAsync(orderItem => orderItem.Id == orderItemId && orderItem.OrderId == orderId, cancellationToken);

        if (item is null)
        {
            return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.OrderItemNotFound));
        }

        if (item.Status == OrderItemStatus.Completed || item.Status == OrderItemStatus.Cancelled)
        {
            return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.OrderItemAlreadyCompleted, "TargetStatus"));
        }

        OrderItemStatus resolvedTarget;
        if (targetStatus.HasValue)
        {
            resolvedTarget = targetStatus.Value;
            if (resolvedTarget == OrderItemStatus.Cancelled)
            {
                return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.InvalidStatusTransition, "TargetStatus"));
            }
            if (!_orderWorkflowService.IsValidForwardTransition(item.Status, resolvedTarget) || resolvedTarget == item.Status)
            {
                return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.InvalidStatusTransition, "TargetStatus"));
            }
        }
        else
        {
            var next = _orderWorkflowService.GetNextStatus(item.Status);
            if (!next.HasValue)
            {
                return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.OrderItemAlreadyAtFinalStage, "TargetStatus"));
            }

            resolvedTarget = next.Value;
        }

        var changeTime = DateTimeOffset.UtcNow;
        item.Status = resolvedTarget;
        item.LastUpdatedAt = changeTime;

        _dbContext.OrderItemStatusHistories.Add(new OrderItemStatusHistory
        {
            OrderItemId = item.Id,
            Status = resolvedTarget,
            ChangedAt = changeTime
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Order item {OrderItemId} for order {OrderId} advanced to status {Status}",
            item.Id,
            orderId,
            item.Status);

        var response = new ActiveOrderItemModel(
            item.Id,
            item.PastelFlavorId,
            item.PastelFlavor.Name,
            item.Quantity,
            item.UnitPrice,
            NormalizeStatus(item.Status),
            item.CreatedAt,
            item.LastUpdatedAt);

        return OperationResult<ActiveOrderItemModel>.Success(response);
    }

    public async Task<IReadOnlyCollection<CustomerOrderModel>> GetCustomerOrdersAsync(Guid customerSessionId, CancellationToken cancellationToken)
    {
        var orders = await _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.CustomerSessionId == customerSessionId)
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => new
            {
                order.Id,
                order.CreatedAt,
                order.TotalAmount,
                Items = order.Items
                    .OrderBy(item => item.CreatedAt)
                    .Select(item => new
                    {
                        item.Id,
                        item.PastelFlavorId,
                        FlavorName = item.PastelFlavor.Name,
                        item.Quantity,
                        item.UnitPrice,
                        item.Status,
                        item.CreatedAt,
                        item.LastUpdatedAt,
                        History = item.StatusHistory
                            .OrderBy(history => history.ChangedAt)
                            .Select(history => new { history.Status, history.ChangedAt })
                            .ToList()
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        var response = orders
            .Select(order => new CustomerOrderModel(
                order.Id,
                order.CreatedAt,
                order.TotalAmount,
                order.Items.Count > 0 && order.Items.All(item => item.Status == OrderItemStatus.Pending),
                order.Items
                    .Select(item =>
                    {
                        var history = NormalizeHistory(item.History
                            .Select(history => new OrderStatusSnapshotModel(history.Status, history.ChangedAt)));

                        return new CustomerOrderItemModel(
                            item.Id,
                            item.PastelFlavorId,
                            item.FlavorName,
                            item.Quantity,
                            item.UnitPrice,
                            NormalizeStatus(item.Status),
                            item.CreatedAt,
                            item.LastUpdatedAt,
                            history
                        );
                    })
                    .ToList()
            ))
            .ToList();

        return response;
    }

    public async Task<IReadOnlyCollection<OrderHistoryGroupModel>> GetOrderHistoryAsync(CancellationToken cancellationToken)
    {
        var orders = await _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.Items.Any(item =>
                item.Status == OrderItemStatus.Completed ||
                item.Status == OrderItemStatus.OutForDelivery))
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => new
            {
                order.Id,
                order.CustomerSessionId,
                CustomerName = order.CustomerSession.DisplayName,
                order.CreatedAt,
                order.TotalAmount,
                Items = order.Items
                    .OrderBy(item => item.CreatedAt)
                    .Select(item => new
                    {
                        item.Id,
                        item.PastelFlavorId,
                        FlavorName = item.PastelFlavor.Name,
                        item.Quantity,
                        item.UnitPrice,
                        History = item.StatusHistory
                            .OrderBy(history => history.ChangedAt)
                            .Select(history => new { history.Status, history.ChangedAt })
                            .ToList()
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        var grouped = orders
            .GroupBy(order => new { order.CustomerSessionId, order.CustomerName })
            .Select(group => new OrderHistoryGroupModel(
                group.Key.CustomerSessionId,
                group.Key.CustomerName,
                group.Select(order => new OrderHistoryOrderModel(
                    order.Id,
                    order.CreatedAt,
                    order.TotalAmount,
                    order.Items
                        .Select(item =>
                        {
                            var history = NormalizeHistory(item.History
                                .Select(history => new OrderStatusSnapshotModel(history.Status, history.ChangedAt)));

                            return new OrderHistoryItemModel(
                                item.Id,
                                item.PastelFlavorId,
                                item.FlavorName,
                                item.Quantity,
                                item.UnitPrice,
                                history
                            );
                        })
                        .ToList()
                ))
                .ToList()
            ))
            .ToList();

        return grouped;
    }

    public async Task<OperationResult> CancelOrderAsync(int orderId, Guid customerSessionId, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(o => o.Items)
                .ThenInclude(item => item.PastelFlavor)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerSessionId == customerSessionId, cancellationToken);

        if (order is null)
        {
            return OperationResult.Failure(new OperationError(ErrorCodes.OrderNotFound, "OrderId"));
        }

        if (order.Items.Any(item => item.Status != OrderItemStatus.Pending))
        {
            return OperationResult.Failure(new OperationError(ErrorCodes.OrderCannotBeCancelled, "OrderId"));
        }

        var changeTime = DateTimeOffset.UtcNow;

        foreach (var item in order.Items)
        {
            item.Status = OrderItemStatus.Cancelled;
            item.LastUpdatedAt = changeTime;
            _dbContext.OrderItemStatusHistories.Add(new OrderItemStatusHistory
            {
                OrderItemId = item.Id,
                Status = OrderItemStatus.Cancelled,
                ChangedAt = changeTime
            });

            if (item.PastelFlavor is not null)
            {
                item.PastelFlavor.AvailableQuantity += item.Quantity;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Order {OrderId} for session {SessionId} was cancelled", order.Id, order.CustomerSessionId);

        return OperationResult.Success();
    }

    private static OrderItemStatus NormalizeStatus(OrderItemStatus status)
        => status switch
        {
            OrderItemStatus.Packaging => OrderItemStatus.Frying,
            OrderItemStatus.OutForDelivery => OrderItemStatus.ReadyForPickup,
            _ => status
        };

    private static IReadOnlyList<OrderStatusSnapshotModel> NormalizeHistory(IEnumerable<OrderStatusSnapshotModel> history)
    {
        var normalized = new List<OrderStatusSnapshotModel>();

        foreach (var entry in history.OrderBy(entry => entry.ChangedAt))
        {
            var status = NormalizeStatus(entry.Status);
            if (normalized.Count == 0 || normalized[^1].Status != status)
            {
                normalized.Add(new OrderStatusSnapshotModel(status, entry.ChangedAt));
            }
        }

        return normalized;
    }
}
