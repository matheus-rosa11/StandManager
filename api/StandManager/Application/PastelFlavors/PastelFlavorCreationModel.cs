namespace StandManager.Application.PastelFlavors;

public sealed record PastelFlavorCreationModel(
    string Name,
    string? Description,
    string? ImageUrl,
    int AvailableQuantity,
    decimal Price);
