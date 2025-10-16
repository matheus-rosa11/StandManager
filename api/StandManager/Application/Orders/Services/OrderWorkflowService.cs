using System.Collections.Generic;
using StandManager.Entities;

namespace StandManager.Application.Orders.Services;

public sealed class OrderWorkflowService : IOrderWorkflowService
{
    private static readonly IReadOnlyList<OrderItemStatus> OrderedStatuses = new[]
    {
        OrderItemStatus.Pending,
        OrderItemStatus.Frying,
        OrderItemStatus.Packaging,
        OrderItemStatus.ReadyForPickup,
        OrderItemStatus.OutForDelivery,
        OrderItemStatus.Completed
    };

    public OrderItemStatus? GetNextStatus(OrderItemStatus currentStatus)
    {
        var index = IndexOf(currentStatus);
        if (index < 0 || index + 1 >= OrderedStatuses.Count)
        {
            return null;
        }

        return OrderedStatuses[index + 1];
    }

    public bool IsValidForwardTransition(OrderItemStatus currentStatus, OrderItemStatus targetStatus)
    {
        var currentIndex = IndexOf(currentStatus);
        var targetIndex = IndexOf(targetStatus);
        return currentIndex >= 0 && targetIndex >= 0 && targetIndex >= currentIndex && targetIndex <= currentIndex + 1;
    }

    public bool IsFinalStatus(OrderItemStatus status)
        => status == OrderItemStatus.Cancelled || IndexOf(status) == OrderedStatuses.Count - 1;

    private static int IndexOf(OrderItemStatus status)
    {
        for (var i = 0; i < OrderedStatuses.Count; i++)
        {
            if (OrderedStatuses[i] == status)
            {
                return i;
            }
        }

        return -1;
    }
}
