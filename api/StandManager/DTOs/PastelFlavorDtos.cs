using System.ComponentModel.DataAnnotations;

namespace StandManager.DTOs;

public record PastelFlavorResponse(Guid Id, string Name, string? Description, string? ImageUrl, int AvailableQuantity);

public class CreatePastelFlavorRequest
{
    [Required]
    [StringLength(80)]
    public string Name { get; init; } = string.Empty;

    [StringLength(256)]
    public string? Description { get; init; }

    [Url]
    [StringLength(256)]
    public string? ImageUrl { get; init; }

    [Range(0, int.MaxValue)]
    public int AvailableQuantity { get; init; }
}

public class UpdatePastelFlavorRequest
{
    [Required]
    [StringLength(80)]
    public string Name { get; init; } = string.Empty;

    [StringLength(256)]
    public string? Description { get; init; }

    [Url]
    [StringLength(256)]
    public string? ImageUrl { get; init; }
}

public class UpdatePastelInventoryRequest
{
    [Range(0, int.MaxValue)]
    public int AvailableQuantity { get; init; }
}
