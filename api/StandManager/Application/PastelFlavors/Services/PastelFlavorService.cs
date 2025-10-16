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
