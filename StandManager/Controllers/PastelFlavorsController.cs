using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using StandManager.Application.Common.Errors;
using StandManager.Application.PastelFlavors;
using StandManager.DTOs;
using StandManager.Localization;

namespace StandManager.Controllers;

[Route("api/[controller]")]
public class PastelFlavorsController : LocalizedControllerBase
{
    private readonly IPastelFlavorService _pastelFlavorService;

    public PastelFlavorsController(IPastelFlavorService pastelFlavorService, IStringLocalizer<SharedResources> localizer)
        : base(localizer)
    {
        _pastelFlavorService = pastelFlavorService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PastelFlavorResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        var flavors = await _pastelFlavorService.GetAllAsync(cancellationToken);
        var response = flavors
            .Select(f => new PastelFlavorResponse(f.Id, f.Name, f.Description, f.ImageUrl, f.AvailableQuantity))
            .ToList();

        return Ok(response);
    }

    [HttpPost]
    [ProducesResponseType(typeof(PastelFlavorResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreatePastelFlavorRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }
        var result = await _pastelFlavorService.CreateAsync(
            request.Name,
            request.Description,
            request.ImageUrl,
            request.AvailableQuantity,
            cancellationToken);

        if (!result.Succeeded)
        {
            return Problem(result);
        }

        var flavor = result.Value!;
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
        var result = await _pastelFlavorService.UpdateAsync(
            id,
            request.Name,
            request.Description,
            request.ImageUrl,
            cancellationToken);

        if (!result.Succeeded)
        {
            var status = result.Errors.Any(e => e.Code == ErrorCodes.FlavorNotFound)
                ? StatusCodes.Status404NotFound
                : StatusCodes.Status400BadRequest;

            return Problem(result, status);
        }

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
        var result = await _pastelFlavorService.UpdateInventoryAsync(id, request.AvailableQuantity, cancellationToken);

        if (!result.Succeeded)
        {
            var status = result.Errors.Any(e => e.Code == ErrorCodes.FlavorNotFound)
                ? StatusCodes.Status404NotFound
                : StatusCodes.Status400BadRequest;

            return Problem(result, status);
        }

        return NoContent();
    }
}
