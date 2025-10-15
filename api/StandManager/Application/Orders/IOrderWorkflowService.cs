using StandManager.Entities;

namespace StandManager.Application.Orders;

public interface IOrderWorkflowService
{
    bool IsValidForwardTransition(OrderItemStatus currentStatus, OrderItemStatus targetStatus);
    OrderItemStatus? GetNextStatus(OrderItemStatus currentStatus);
    bool IsFinalStatus(OrderItemStatus status);
}
