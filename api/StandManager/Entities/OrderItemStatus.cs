namespace StandManager.Entities;

public enum OrderItemStatus
{
    Pending = 0,
    Frying = 1,
    Packaging = 2,
    ReadyForPickup = 3,
    OutForDelivery = 4,
    Completed = 5,
    Cancelled = 6
}
