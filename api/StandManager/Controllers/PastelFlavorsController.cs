using System;
using System.Data.Common;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        try
        {
            var flavors = await _pastelFlavorService.GetAllAsync(cancellationToken);
            var response = flavors
                .Select(f => new PastelFlavorResponse(f.Id, f.Name, f.Description, f.ImageUrl, f.AvailableQuantity, f.Price))
                .ToList();

            return Ok(response);
        }
        catch (OperationCanceledException ex)
        {
            return HandleException(ex, "ErrorRequestCancelled", StatusCodes.Status499ClientClosedRequest);
        }
        catch (DbException ex)
        {
            return HandleException(ex, "ErrorDatabaseUnavailable", StatusCodes.Status503ServiceUnavailable);
        }
        catch (Exception ex)
        {
            return HandleException(ex, "ErrorUnexpected", StatusCodes.Status500InternalServerError);
        }
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreatePastelFlavorRequest request, CancellationToken cancellationToken)
    {
        try
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
                request.Price,
                cancellationToken);

            if (!result.Succeeded)
            {
                return Problem(result);
            }

            var location = Url.ActionLink(nameof(GetAsync)) ?? "/api/PastelFlavors";
            return Created(location, null);
        }
        catch (OperationCanceledException ex)
        {
            return HandleException(ex, "ErrorRequestCancelled", StatusCodes.Status499ClientClosedRequest);
        }
        catch (DbUpdateException ex)
        {
            return HandleException(ex, "ErrorDatabaseWrite", StatusCodes.Status500InternalServerError);
        }
        catch (DbException ex)
        {
            return HandleException(ex, "ErrorDatabaseUnavailable", StatusCodes.Status503ServiceUnavailable);
        }
        catch (Exception ex)
        {
            return HandleException(ex, "ErrorUnexpected", StatusCodes.Status500InternalServerError);
        }
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] UpdatePastelFlavorRequest request, CancellationToken cancellationToken)
    {
        try
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
                request.Price,
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
        catch (OperationCanceledException ex)
        {
            return HandleException(ex, "ErrorRequestCancelled", StatusCodes.Status499ClientClosedRequest);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            return HandleException(ex, "ErrorConcurrencyConflict", StatusCodes.Status409Conflict);
        }
        catch (DbUpdateException ex)
        {
            return HandleException(ex, "ErrorDatabaseWrite", StatusCodes.Status500InternalServerError);
        }
        catch (DbException ex)
        {
            return HandleException(ex, "ErrorDatabaseUnavailable", StatusCodes.Status503ServiceUnavailable);
        }
        catch (Exception ex)
        {
            return HandleException(ex, "ErrorUnexpected", StatusCodes.Status500InternalServerError);
        }
    }

    [HttpPatch("{id:guid}/inventory")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateInventoryAsync(Guid id, [FromBody] UpdatePastelInventoryRequest request, CancellationToken cancellationToken)
    {
        try
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
        catch (OperationCanceledException ex)
        {
            return HandleException(ex, "ErrorRequestCancelled", StatusCodes.Status499ClientClosedRequest);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            return HandleException(ex, "ErrorConcurrencyConflict", StatusCodes.Status409Conflict);
        }
        catch (DbUpdateException ex)
        {
            return HandleException(ex, "ErrorDatabaseWrite", StatusCodes.Status500InternalServerError);
        }
        catch (DbException ex)
        {
            return HandleException(ex, "ErrorDatabaseUnavailable", StatusCodes.Status503ServiceUnavailable);
        }
        catch (Exception ex)
        {
            return HandleException(ex, "ErrorUnexpected", StatusCodes.Status500InternalServerError);
        }
    }
}
