using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using StandManager.Application.Common.Results;
using StandManager.Application.Orders.Models;
using StandManager.Entities;

namespace StandManager.Application.Orders;

public interface IOrderService
{
    Task<OperationResult<OrderCreationResult>> CreateOrderAsync(
        int customerId,
        string customerName,
        IReadOnlyCollection<OrderItemRequestModel> items,
        CancellationToken cancellationToken);

    Task<IReadOnlyCollection<ActiveOrderGroupModel>> GetActiveOrdersAsync(string? search, CancellationToken cancellationToken);

    Task<OperationResult<ActiveOrderItemModel>> AdvanceOrderItemStatusAsync(
        int orderId,
        Guid orderItemId,
        OrderItemStatus? targetStatus,
        CancellationToken cancellationToken);

    Task<IReadOnlyCollection<CustomerOrderModel>> GetCustomerOrdersAsync(int customerId, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<OrderHistoryGroupModel>> GetOrderHistoryAsync(string? search, CancellationToken cancellationToken);

    Task<OperationResult> CancelOrderAsync(int orderId, int customerId, CancellationToken cancellationToken);
}
