using StandManager.Entities;

namespace StandManager.Services;

public static class OrderWorkflowService
{
    private static readonly IReadOnlyList<OrderItemStatus> OrderedStatuses = new[]
    {
        OrderItemStatus.Pending,
        OrderItemStatus.Frying,
        OrderItemStatus.Packaging,
        OrderItemStatus.ReadyForPickup,
        OrderItemStatus.Completed
    };

    public static OrderItemStatus? GetNextStatus(OrderItemStatus current)
    {
        var index = OrderedStatuses.IndexOf(current);
        if (index < 0 || index + 1 >= OrderedStatuses.Count)
        {
            return null;
        }

        return OrderedStatuses[index + 1];
    }

    public static bool IsValidForwardTransition(OrderItemStatus current, OrderItemStatus target)
    {
        var currentIndex = OrderedStatuses.IndexOf(current);
        var targetIndex = OrderedStatuses.IndexOf(target);
        return currentIndex >= 0 && targetIndex >= 0 && targetIndex >= currentIndex && targetIndex <= currentIndex + 1;
    }

    private static int IndexOf(this IReadOnlyList<OrderItemStatus> statuses, OrderItemStatus status)
    {
        for (var i = 0; i < statuses.Count; i++)
        {
            if (statuses[i] == status)
            {
                return i;
            }
        }

        return -1;
    }
}
