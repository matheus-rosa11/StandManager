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
        int customerId,
        string customerName,
        IReadOnlyCollection<OrderItemRequestModel> items,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0)
        {
            return OperationResult<OrderCreationResult>.Failure(new OperationError(ErrorCodes.OrderMustHaveItems, nameof(items)));
        }

        var normalizedName = customerName.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName))
        {
            return OperationResult<OrderCreationResult>.Failure(new OperationError(ErrorCodes.CustomerNameRequired, nameof(customerName)));
        }

        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(c => c.Id == customerId && !c.IsVolunteer, cancellationToken);

        if (customer is null)
        {
            return OperationResult<OrderCreationResult>.Failure(new OperationError(ErrorCodes.CustomerNotFound, nameof(customerId)));
        }

        if (!string.Equals(customer.Name, normalizedName, StringComparison.OrdinalIgnoreCase))
        {
            return OperationResult<OrderCreationResult>.Failure(new OperationError(ErrorCodes.CustomerNameMismatch, nameof(customerName)));
        }

        if (!string.Equals(customer.Name, normalizedName, StringComparison.Ordinal))
        {
            customer.Name = normalizedName;
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
            return OperationResult<OrderCreationResult>.Failure(new OperationError(ErrorCodes.FlavorNotFound, nameof(items)));
        }

        var stockErrors = new List<OperationError>();
        foreach (var group in groupedItems)
        {
            var flavor = flavors[group.FlavorId];
            if (flavor.AvailableQuantity < group.Quantity)
            {
                stockErrors.Add(new OperationError(ErrorCodes.FlavorOutOfStock, nameof(items), flavor.Name));
            }
        }

        if (stockErrors.Count > 0)
        {
            return OperationResult<OrderCreationResult>.Failure(stockErrors);
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var order = new Order
        {
            CustomerId = customer.Id,
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

        _logger.LogInformation(
            "Order {OrderId} created for customer {CustomerId} ({CustomerName})",
            order.Id,
            customer.Id,
            customer.Name);

        var result = new OrderCreationResult(
            order.Id,
            customer.Id,
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

    public async Task<IReadOnlyCollection<ActiveOrderGroupModel>> GetActiveOrdersAsync(string? search, CancellationToken cancellationToken)
    {
        var query = _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.Items.Any(item =>
                item.Status != OrderItemStatus.Completed &&
                item.Status != OrderItemStatus.Cancelled &&
                item.Status != OrderItemStatus.OutForDelivery));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmed = search.Trim();
            var like = $"%{trimmed}%";
            query = query.Where(order =>
                EF.Functions.ILike(order.Customer.Name, like) ||
                EF.Functions.ILike(order.CustomerId.ToString(), like));
        }

        var orders = await query
            .OrderBy(order => order.CustomerId)
            .ThenBy(order => order.CreatedAt)
            .Select(order => new
            {
                order.CustomerId,
                CustomerName = order.Customer.Name,
                order.Id,
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
                        item.PastelFlavor.Name,
                        item.Quantity,
                        item.UnitPrice,
                        item.Status,
                        item.CreatedAt,
                        item.LastUpdatedAt
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        var grouped = orders
            .GroupBy(order => new { order.CustomerId, order.CustomerName })
            .Select(group => new ActiveOrderGroupModel(
                group.Key.CustomerId,
                group.Key.CustomerName,
                group.Select(order => new ActiveOrderModel(
                    order.Id,
                    order.CreatedAt,
                    order.TotalAmount,
                    order.Items
                        .Select(item => new ActiveOrderItemModel(
                            item.Id,
                            item.PastelFlavorId,
                            item.Name,
                            item.Quantity,
                            item.UnitPrice,
                            NormalizeStatus(item.Status),
                            item.CreatedAt,
                            item.LastUpdatedAt))
                        .ToList()))
                .ToList()))
            .OrderBy(group => group.CustomerId)
            .ToList();

        return grouped;
    }

    public async Task<OperationResult<ActiveOrderItemModel>> AdvanceOrderItemStatusAsync(
        int orderId,
        Guid orderItemId,
        OrderItemStatus? targetStatus,
        CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.PastelFlavor)
            .Include(o => o.Items)
            .ThenInclude(i => i.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is null)
        {
            return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.OrderNotFound, nameof(orderId)));
        }

        var item = order.Items.FirstOrDefault(i => i.Id == orderItemId);
        if (item is null)
        {
            return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.OrderItemNotFound, nameof(orderItemId)));
        }

        var normalizedCurrent = NormalizeStatus(item.Status);
        if (_orderWorkflowService.IsFinalStatus(normalizedCurrent))
        {
            return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.OrderItemAlreadyCompleted, nameof(targetStatus)));
        }

        var resolvedTarget = targetStatus ?? _orderWorkflowService.GetNextStatus(normalizedCurrent);
        if (resolvedTarget is null)
        {
            return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.OrderItemAlreadyAtFinalStage, nameof(targetStatus)));
        }

        if (!_orderWorkflowService.IsValidForwardTransition(normalizedCurrent, resolvedTarget.Value))
        {
            return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.InvalidStatusTransition, nameof(targetStatus)));
        }

        var changeTime = DateTimeOffset.UtcNow;
        item.Status = resolvedTarget.Value;
        item.LastUpdatedAt = changeTime;

        _dbContext.OrderItemStatusHistories.Add(new OrderItemStatusHistory
        {
            OrderItemId = item.Id,
            Status = resolvedTarget.Value,
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

    public async Task<IReadOnlyCollection<CustomerOrderModel>> GetCustomerOrdersAsync(int customerId, CancellationToken cancellationToken)
    {
        var orders = await _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.CustomerId == customerId)
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
                    .ToList()))
            .ToList();

        return response;
    }

    public async Task<IReadOnlyCollection<OrderHistoryGroupModel>> GetOrderHistoryAsync(string? search, CancellationToken cancellationToken)
    {
        var query = _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.Items.Any(item =>
                item.Status == OrderItemStatus.Completed ||
                item.Status == OrderItemStatus.OutForDelivery));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmed = search.Trim();
            var like = $"%{trimmed}%";
            query = query.Where(order =>
                EF.Functions.ILike(order.Customer.Name, like) ||
                EF.Functions.ILike(order.CustomerId.ToString(), like));
        }

        var orders = await query
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => new
            {
                order.CustomerId,
                CustomerName = order.Customer.Name,
                order.Id,
                order.CreatedAt,
                order.TotalAmount,
                Items = order.Items
                    .OrderBy(item => item.CreatedAt)
                    .Select(item => new
                    {
                        item.Id,
                        item.PastelFlavorId,
                        item.PastelFlavor.Name,
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
            .GroupBy(order => new { order.CustomerId, order.CustomerName })
            .Select(group => new OrderHistoryGroupModel(
                group.Key.CustomerId,
                group.Key.CustomerName,
                group.Select(order => new OrderHistoryOrderModel(
                    order.Id,
                    order.CreatedAt,
                    order.TotalAmount,
                    order.Items
                        .Select(item => new OrderHistoryItemModel(
                            item.Id,
                            item.PastelFlavorId,
                            item.Name,
                            item.Quantity,
                            item.UnitPrice,
                            NormalizeHistory(item.History
                                .Select(history => new OrderStatusSnapshotModel(history.Status, history.ChangedAt))))
                        .ToList()))
                .ToList()))
            .OrderByDescending(group => group.Orders.Max(o => o.CreatedAt))
            .ToList();

        return grouped;
    }

    public async Task<OperationResult> CancelOrderAsync(int orderId, int customerId, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId, cancellationToken);

        if (order is null)
        {
            return OperationResult.Failure(new OperationError(ErrorCodes.OrderNotFound, nameof(orderId)));
        }

        if (!order.Items.All(item => item.Status == OrderItemStatus.Pending))
        {
            return OperationResult.Failure(new OperationError(ErrorCodes.OrderCannotBeCancelled, nameof(orderId)));
        }

        foreach (var item in order.Items)
        {
            item.Status = OrderItemStatus.Cancelled;
            item.LastUpdatedAt = DateTimeOffset.UtcNow;

            _dbContext.OrderItemStatusHistories.Add(new OrderItemStatusHistory
            {
                OrderItemId = item.Id,
                Status = OrderItemStatus.Cancelled,
                ChangedAt = item.LastUpdatedAt.Value
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Order {OrderId} cancelled for customer {CustomerId}",
            order.Id,
            order.CustomerId);

        return OperationResult.Success();
    }

    private static OrderItemStatus NormalizeStatus(OrderItemStatus status)
        => status switch
        {
            OrderItemStatus.Packaging => OrderItemStatus.Frying,
            OrderItemStatus.OutForDelivery => OrderItemStatus.ReadyForPickup,
            _ => status
        };

    private static IReadOnlyCollection<OrderStatusSnapshotModel> NormalizeHistory(IEnumerable<OrderStatusSnapshotModel> history)
    {
        return history
            .Select(entry => new OrderStatusSnapshotModel(NormalizeStatus(entry.Status), entry.ChangedAt))
            .OrderBy(entry => entry.ChangedAt)
            .ToList();
    }
}
