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
        string customerName,
        Guid? customerSessionId,
        IReadOnlyCollection<OrderItemRequestModel> items,
        CancellationToken cancellationToken);

    Task<IReadOnlyCollection<ActiveOrderGroupModel>> GetActiveOrdersAsync(CancellationToken cancellationToken);

    Task<OperationResult<ActiveOrderItemModel>> AdvanceOrderItemStatusAsync(
        Guid orderId,
        Guid orderItemId,
        OrderItemStatus? targetStatus,
        CancellationToken cancellationToken);
}
