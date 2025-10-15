using System.ComponentModel.DataAnnotations;

namespace StandManager.Entities;

public class PastelFlavor
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(80)]
    public string Name { get; set; } = string.Empty;

    [StringLength(256)]
    public string? Description { get; set; }

    [Url]
    [StringLength(256)]
    public string? ImageUrl { get; set; }

    [Range(0, int.MaxValue)]
    public int AvailableQuantity { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<OrderItem> OrderItems { get; set; } = new HashSet<OrderItem>();
}
