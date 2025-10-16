using System.ComponentModel.DataAnnotations;

namespace StandManager.Entities;

public class OrderItemStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid OrderItemId { get; set; }

    public OrderItem OrderItem { get; set; } = default!;

    [Required]
    public OrderItemStatus Status { get; set; }

    public DateTimeOffset ChangedAt { get; set; } = DateTimeOffset.UtcNow;
}
