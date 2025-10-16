using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using StandManager.Application.Common.Results;
using StandManager.Entities;

namespace StandManager.Application.PastelFlavors;

public interface IPastelFlavorService
{
    Task<IReadOnlyCollection<PastelFlavor>> GetAllAsync(CancellationToken cancellationToken);
    Task<OperationResult<PastelFlavor>> CreateAsync(string name, string? description, string? imageUrl, int availableQuantity, decimal price, CancellationToken cancellationToken);
    Task<OperationResult> UpdateAsync(Guid id, string name, string? description, string? imageUrl, decimal price, CancellationToken cancellationToken);
    Task<OperationResult> UpdateInventoryAsync(Guid id, int availableQuantity, CancellationToken cancellationToken);
}
