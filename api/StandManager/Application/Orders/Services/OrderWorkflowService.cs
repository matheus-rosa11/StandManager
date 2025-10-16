using System.Collections.Generic;
using StandManager.Entities;

namespace StandManager.Application.Orders.Services;

public sealed class OrderWorkflowService : IOrderWorkflowService
{
    private static readonly IReadOnlyList<OrderItemStatus> OrderedStatuses = new[]
    {
        OrderItemStatus.Pending,
        OrderItemStatus.Frying,
        OrderItemStatus.ReadyForPickup,
        OrderItemStatus.Completed
    };

    public OrderItemStatus? GetNextStatus(OrderItemStatus currentStatus)
    {
        var normalized = Normalize(currentStatus);
        var index = IndexOf(normalized);
        if (index < 0 || index + 1 >= OrderedStatuses.Count)
        {
            return null;
        }

        return OrderedStatuses[index + 1];
    }

    public bool IsValidForwardTransition(OrderItemStatus currentStatus, OrderItemStatus targetStatus)
    {
        var currentIndex = IndexOf(Normalize(currentStatus));
        var targetIndex = IndexOf(Normalize(targetStatus));
        return currentIndex >= 0 && targetIndex >= 0 && targetIndex >= currentIndex && targetIndex <= currentIndex + 1;
    }

    public bool IsFinalStatus(OrderItemStatus status)
        => status == OrderItemStatus.Cancelled || IndexOf(Normalize(status)) == OrderedStatuses.Count - 1;

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

    private static OrderItemStatus Normalize(OrderItemStatus status)
        => status switch
        {
            OrderItemStatus.Packaging => OrderItemStatus.Frying,
            OrderItemStatus.OutForDelivery => OrderItemStatus.ReadyForPickup,
            _ => status
        };
}
