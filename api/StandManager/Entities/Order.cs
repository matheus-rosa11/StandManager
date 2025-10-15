using System.ComponentModel.DataAnnotations;

namespace StandManager.Entities;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid CustomerSessionId { get; set; }

    public CustomerSession CustomerSession { get; set; } = default!;

    [Required]
    public string CustomerNameSnapshot { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<OrderItem> Items { get; set; } = new HashSet<OrderItem>();
}
