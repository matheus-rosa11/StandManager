using System.ComponentModel.DataAnnotations;

namespace StandManager.DTOs;

public class RegisterCustomerRequest
{
    [Required]
    [StringLength(120)]
    public string Name { get; init; } = string.Empty;
}

public class ConfirmCustomerRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int CustomerId { get; init; }

    [Required]
    [StringLength(120)]
    public string Name { get; init; } = string.Empty;
}

public record CustomerResponse(int Id, string Name, DateTimeOffset CreatedAt);
