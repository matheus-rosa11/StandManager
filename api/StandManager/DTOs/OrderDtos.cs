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
    public Guid? CustomerSessionId { get; init; }

    [Required]
    [StringLength(120)]
    public string CustomerName { get; init; } = string.Empty;

    [MinLength(1)]
    public IReadOnlyCollection<OrderItemRequest> Items { get; init; } = Array.Empty<OrderItemRequest>();
}

public record OrderCreatedResponse(Guid OrderId, Guid CustomerSessionId, IReadOnlyCollection<OrderItemSummary> Items);

public record OrderItemSummary(Guid OrderItemId, Guid PastelFlavorId, int Quantity, OrderItemStatus Status);

public record ActiveOrderGroupResponse(Guid CustomerSessionId, string CustomerName, IReadOnlyCollection<ActiveOrderResponse> Orders);

public record ActiveOrderResponse(Guid OrderId, DateTimeOffset CreatedAt, IReadOnlyCollection<ActiveOrderItemResponse> Items);

public record ActiveOrderItemResponse(Guid ItemId, Guid PastelFlavorId, string FlavorName, int Quantity, OrderItemStatus Status, DateTimeOffset CreatedAt, DateTimeOffset? LastUpdatedAt);

public record AdvanceOrderItemRequest(OrderItemStatus? TargetStatus);
