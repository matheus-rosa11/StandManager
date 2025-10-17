using System.ComponentModel.DataAnnotations;

namespace StandManager.Entities;

public class Customer
{
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Name { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public bool IsVolunteer { get; set; }

    public ICollection<Order> Orders { get; set; } = new HashSet<Order>();
}
