using System.ComponentModel.DataAnnotations;

namespace StandManager.Entities;

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public int OrderId { get; set; }

    public Order Order { get; set; } = default!;

    [Required]
    public Guid PastelFlavorId { get; set; }

    public PastelFlavor PastelFlavor { get; set; } = default!;

    [Range(1, 100)]
    public int Quantity { get; set; }

    public OrderItemStatus Status { get; set; } = OrderItemStatus.Pending;

    [Range(typeof(decimal), "0", "1000000")]
    public decimal UnitPrice { get; set; }

    [StringLength(256)]
    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? LastUpdatedAt { get; set; }

    public ICollection<OrderItemStatusHistory> StatusHistory { get; set; } = new HashSet<OrderItemStatusHistory>();
}
