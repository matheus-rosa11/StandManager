using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace StandManager.DTOs;

public record PastelFlavorResponse(Guid Id, string Name, string? Description, string? ImageUrl, int AvailableQuantity, decimal Price);

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

    [Range(typeof(decimal), "0", "1000000")]
    public decimal Price { get; init; }
}

public class CreatePastelFlavorBatchRequest
{
    [Required]
    [MinLength(1)]
    public List<CreatePastelFlavorRequest> Items { get; init; } = new();
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

    [Range(typeof(decimal), "0", "1000000")]
    public decimal Price { get; init; }
}

public class UpdatePastelInventoryRequest
{
    [Range(0, int.MaxValue)]
    public int AvailableQuantity { get; init; }
}
