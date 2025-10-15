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

        foreach (var group in groupedItems)
        {
            var flavor = flavors[group.FlavorId];
            flavor.AvailableQuantity -= group.Quantity;

            foreach (var item in group.Items)
            {
                order.Items.Add(new OrderItem
                {
                    PastelFlavorId = item.PastelFlavorId,
                    Quantity = item.Quantity,
                    Notes = item.Notes?.Trim()
                });
            }
        }

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation("Order {OrderId} created for session {SessionId} ({CustomerName})", order.Id, session.Id, session.DisplayName);

        var result = new OrderCreationResult(
            order.Id,
            session.Id,
            order.Items.Select(item => new OrderItemSummaryModel(item.Id, item.PastelFlavorId, item.Quantity, item.Status)).ToList());

        return OperationResult<OrderCreationResult>.Success(result);
    }

    public async Task<IReadOnlyCollection<ActiveOrderGroupModel>> GetActiveOrdersAsync(CancellationToken cancellationToken)
    {
        var orders = await _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.Items.Any(item => item.Status != OrderItemStatus.Completed))
            .Select(order => new
            {
                order.Id,
                order.CustomerSessionId,
                CustomerName = order.CustomerSession.DisplayName,
                order.CreatedAt,
                Items = order.Items
                    .Where(item => item.Status != OrderItemStatus.Completed)
                    .OrderBy(item => item.CreatedAt)
                    .Select(item => new
                    {
                        item.Id,
                        item.PastelFlavorId,
                        FlavorName = item.PastelFlavor.Name,
                        item.Quantity,
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
                    order.Items.Select(item => new ActiveOrderItemModel(
                        item.Id,
                        item.PastelFlavorId,
                        item.FlavorName,
                        item.Quantity,
                        item.Status,
                        item.CreatedAt,
                        item.LastUpdatedAt
                    )).ToList()
                )).ToList()
            ))
            .ToList();

        return grouped;
    }

    public async Task<OperationResult<ActiveOrderItemModel>> AdvanceOrderItemStatusAsync(
        Guid orderId,
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

        if (item.Status == OrderItemStatus.Completed)
        {
            return OperationResult<ActiveOrderItemModel>.Failure(new OperationError(ErrorCodes.OrderItemAlreadyCompleted, "TargetStatus"));
        }

        OrderItemStatus resolvedTarget;
        if (targetStatus.HasValue)
        {
            resolvedTarget = targetStatus.Value;
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

        item.Status = resolvedTarget;
        item.LastUpdatedAt = DateTimeOffset.UtcNow;

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
            item.Status,
            item.CreatedAt,
            item.LastUpdatedAt);

        return OperationResult<ActiveOrderItemModel>.Success(response);
    }
}
