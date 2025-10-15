using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StandManager.Data;
using StandManager.DTOs;
using StandManager.Entities;

namespace StandManager.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PastelFlavorsController : ControllerBase
{
    private readonly StandManagerDbContext _dbContext;

    public PastelFlavorsController(StandManagerDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PastelFlavorResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        var flavors = await _dbContext.PastelFlavors
            .AsNoTracking()
            .OrderBy(f => f.Name)
            .Select(f => new PastelFlavorResponse(f.Id, f.Name, f.Description, f.ImageUrl, f.AvailableQuantity))
            .ToListAsync(cancellationToken);

        return Ok(flavors);
    }

    [HttpPost]
    [ProducesResponseType(typeof(PastelFlavorResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreatePastelFlavorRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var normalizedName = request.Name.Trim();
        var exists = await _dbContext.PastelFlavors
            .AnyAsync(f => f.Name == normalizedName, cancellationToken);

        if (exists)
        {
            ModelState.AddModelError(nameof(request.Name), "Flavor name already exists.");
            return ValidationProblem(ModelState);
        }

        var flavor = new PastelFlavor
        {
            Name = normalizedName,
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl,
            AvailableQuantity = request.AvailableQuantity
        };

        _dbContext.PastelFlavors.Add(flavor);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = new PastelFlavorResponse(flavor.Id, flavor.Name, flavor.Description, flavor.ImageUrl, flavor.AvailableQuantity);
        return CreatedAtAction(nameof(GetAsync), new { id = flavor.Id }, response);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] UpdatePastelFlavorRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var flavor = await _dbContext.PastelFlavors.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (flavor is null)
        {
            return NotFound();
        }

        var normalizedName = request.Name.Trim();
        var nameConflict = await _dbContext.PastelFlavors
            .AnyAsync(f => f.Id != id && f.Name == normalizedName, cancellationToken);
        if (nameConflict)
        {
            ModelState.AddModelError(nameof(request.Name), "Flavor name already exists.");
            return ValidationProblem(ModelState);
        }

        flavor.Name = normalizedName;
        flavor.Description = request.Description?.Trim();
        flavor.ImageUrl = request.ImageUrl;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:guid}/inventory")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateInventoryAsync(Guid id, [FromBody] UpdatePastelInventoryRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var flavor = await _dbContext.PastelFlavors.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (flavor is null)
        {
            return NotFound();
        }

        flavor.AvailableQuantity = request.AvailableQuantity;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
