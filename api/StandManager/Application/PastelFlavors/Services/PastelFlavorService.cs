using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StandManager.Application.Common.Errors;
using StandManager.Application.Common.Results;
using StandManager.Data;
using StandManager.Entities;

namespace StandManager.Application.PastelFlavors.Services;

public sealed class PastelFlavorService : IPastelFlavorService
{
    private readonly StandManagerDbContext _dbContext;

    public PastelFlavorService(StandManagerDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<PastelFlavor>> GetAllAsync(CancellationToken cancellationToken)
    {
        var flavors = await _dbContext.PastelFlavors
            .AsNoTracking()
            .OrderBy(flavor => flavor.Name)
            .ToListAsync(cancellationToken);

        return flavors;
    }

    public async Task<OperationResult<PastelFlavor>> CreateAsync(
        string name,
        string? description,
        string? imageUrl,
        int availableQuantity,
        decimal price,
        CancellationToken cancellationToken)
    {
        var normalizedName = name.Trim();
        if (normalizedName.Length == 0)
        {
            return OperationResult<PastelFlavor>.Failure(new OperationError(ErrorCodes.FlavorNameRequired, "Name"));
        }
        var existingFlavor = await _dbContext.PastelFlavors
            .FirstOrDefaultAsync(flavor => flavor.Name == normalizedName, cancellationToken);

        if (existingFlavor is not null)
        {
            existingFlavor.AvailableQuantity += availableQuantity;
            existingFlavor.Price = price;

            if (!string.IsNullOrWhiteSpace(description))
            {
                existingFlavor.Description = description.Trim();
            }

            if (!string.IsNullOrWhiteSpace(imageUrl))
            {
                existingFlavor.ImageUrl = imageUrl;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return OperationResult<PastelFlavor>.Success(existingFlavor);
        }

        var flavor = new PastelFlavor
        {
            Name = normalizedName,
            Description = description?.Trim(),
            ImageUrl = imageUrl,
            AvailableQuantity = availableQuantity,
            Price = price
        };

        _dbContext.PastelFlavors.Add(flavor);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return OperationResult<PastelFlavor>.Success(flavor);
    }

    public async Task<OperationResult<IReadOnlyCollection<PastelFlavor>>> CreateBatchAsync(
        IReadOnlyCollection<PastelFlavorCreationModel> flavors,
        CancellationToken cancellationToken)
    {
        if (flavors.Count == 0)
        {
            return OperationResult<IReadOnlyCollection<PastelFlavor>>.Success(Array.Empty<PastelFlavor>());
        }

        var normalizedEntries = flavors
            .Select(flavor => new
            {
                Name = flavor.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(flavor.Description) ? null : flavor.Description.Trim(),
                ImageUrl = string.IsNullOrWhiteSpace(flavor.ImageUrl) ? null : flavor.ImageUrl.Trim(),
                flavor.AvailableQuantity,
                flavor.Price
            })
            .ToList();

        if (normalizedEntries.Any(entry => entry.Name.Length == 0))
        {
            return OperationResult<IReadOnlyCollection<PastelFlavor>>.Failure(
                new OperationError(ErrorCodes.FlavorNameRequired, "Name"));
        }

        var duplicateNames = normalizedEntries
            .GroupBy(entry => entry.Name, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateNames.Count > 0)
        {
            return OperationResult<IReadOnlyCollection<PastelFlavor>>.Failure(
                duplicateNames.Select(name => new OperationError(ErrorCodes.FlavorNameExists, "Name", name)));
        }

        var normalizedNames = normalizedEntries.Select(entry => entry.Name).ToList();
        var existingFlavors = await _dbContext.PastelFlavors
            .Where(flavor => normalizedNames.Contains(flavor.Name))
            .ToListAsync(cancellationToken);

        var existingByName = existingFlavors.ToDictionary(f => f.Name, StringComparer.OrdinalIgnoreCase);
        var affectedFlavors = new List<PastelFlavor>();

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        foreach (var entry in normalizedEntries)
        {
            if (existingByName.TryGetValue(entry.Name, out var existingFlavor))
            {
                existingFlavor.AvailableQuantity += entry.AvailableQuantity;
                existingFlavor.Price = entry.Price;

                if (entry.Description is not null)
                {
                    existingFlavor.Description = entry.Description;
                }

                if (entry.ImageUrl is not null)
                {
                    existingFlavor.ImageUrl = entry.ImageUrl;
                }

                affectedFlavors.Add(existingFlavor);
                continue;
            }

            var flavor = new PastelFlavor
            {
                Name = entry.Name,
                Description = entry.Description,
                ImageUrl = entry.ImageUrl,
                AvailableQuantity = entry.AvailableQuantity,
                Price = entry.Price
            };

            _dbContext.PastelFlavors.Add(flavor);
            affectedFlavors.Add(flavor);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return OperationResult<IReadOnlyCollection<PastelFlavor>>.Success(affectedFlavors.AsReadOnly());
    }

    public async Task<OperationResult> UpdateAsync(
        Guid id,
        string name,
        string? description,
        string? imageUrl,
        decimal price,
        CancellationToken cancellationToken)
    {
        var flavor = await _dbContext.PastelFlavors.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (flavor is null)
        {
            return OperationResult.Failure(new OperationError(ErrorCodes.FlavorNotFound, "Id"));
        }

        var normalizedName = name.Trim();
        var nameConflict = await _dbContext.PastelFlavors
            .AnyAsync(f => f.Id != id && f.Name == normalizedName, cancellationToken);
        if (nameConflict)
        {
            return OperationResult.Failure(new OperationError(ErrorCodes.FlavorNameExists, "Name"));
        }

        flavor.Name = normalizedName;
        flavor.Description = description?.Trim();
        flavor.ImageUrl = imageUrl;
        flavor.Price = price;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return OperationResult.Success();
    }

    public async Task<OperationResult> UpdateInventoryAsync(Guid id, int availableQuantity, CancellationToken cancellationToken)
    {
        var flavor = await _dbContext.PastelFlavors.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (flavor is null)
        {
            return OperationResult.Failure(new OperationError(ErrorCodes.FlavorNotFound, "Id"));
        }

        flavor.AvailableQuantity = availableQuantity;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return OperationResult.Success();
    }
}
