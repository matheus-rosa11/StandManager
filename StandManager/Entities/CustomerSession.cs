using System.ComponentModel.DataAnnotations;

namespace StandManager.Entities;

public class CustomerSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(120)]
    public string DisplayName { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Order> Orders { get; set; } = new HashSet<Order>();
}
