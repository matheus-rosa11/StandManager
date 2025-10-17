using System.ComponentModel.DataAnnotations;
using StandManager.Entities;

namespace StandManager.DTOs;

public class OrderItemRequest
{
    [Required]
    public Guid PastelFlavorId { get; init; }

    [Range(1, 100)]
    public int Quantity { get; init; }

    [StringLength(256)]
    public string? Notes { get; init; }
}

public class CreateOrderRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int CustomerId { get; init; }

    [Required]
    [StringLength(120)]
    public string CustomerName { get; init; } = string.Empty;

    [MinLength(1)]
    public IReadOnlyCollection<OrderItemRequest> Items { get; init; } = Array.Empty<OrderItemRequest>();
}

public record OrderCreatedResponse(int OrderId, int CustomerId, decimal TotalAmount, IReadOnlyCollection<OrderItemSummary> Items);

public record OrderItemSummary(Guid OrderItemId, Guid PastelFlavorId, int Quantity, OrderItemStatus Status, decimal UnitPrice);

public record ActiveOrderGroupResponse(int CustomerId, string CustomerName, IReadOnlyCollection<ActiveOrderResponse> Orders);

public record ActiveOrderResponse(int OrderId, DateTimeOffset CreatedAt, decimal TotalAmount, IReadOnlyCollection<ActiveOrderItemResponse> Items);

public record ActiveOrderItemResponse(Guid ItemId, Guid PastelFlavorId, string FlavorName, int Quantity, decimal UnitPrice, OrderItemStatus Status, DateTimeOffset CreatedAt, DateTimeOffset? LastUpdatedAt);

public record CustomerOrderResponse(int OrderId, DateTimeOffset CreatedAt, decimal TotalAmount, bool IsCancelable, IReadOnlyCollection<CustomerOrderItemResponse> Items);

public record CustomerOrderItemResponse(
    Guid ItemId,
    Guid PastelFlavorId,
    string FlavorName,
    int Quantity,
    decimal UnitPrice,
    OrderItemStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastUpdatedAt,
    IReadOnlyCollection<OrderStatusSnapshotResponse> History);

public record OrderStatusSnapshotResponse(OrderItemStatus Status, DateTimeOffset ChangedAt);

public record OrderHistoryGroupResponse(int CustomerId, string CustomerName, IReadOnlyCollection<OrderHistoryOrderResponse> Orders);

public record OrderHistoryOrderResponse(int OrderId, DateTimeOffset CreatedAt, decimal TotalAmount, IReadOnlyCollection<OrderHistoryItemResponse> Items);

public record OrderHistoryItemResponse(
    Guid ItemId,
    Guid PastelFlavorId,
    string FlavorName,
    int Quantity,
    decimal UnitPrice,
    IReadOnlyCollection<OrderStatusSnapshotResponse> History);

public class CancelOrderRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int CustomerId { get; init; }
}

public record AdvanceOrderItemRequest(OrderItemStatus? TargetStatus);
