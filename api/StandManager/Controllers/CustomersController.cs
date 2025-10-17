using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using StandManager.Application.Common.Errors;
using StandManager.Application.Customers;
using StandManager.Application.Customers.Models;
using StandManager.DTOs;
using StandManager.Localization;

namespace StandManager.Controllers;

[Route("api/[controller]")]
public class CustomersController : LocalizedControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService, IStringLocalizer<SharedResources> localizer)
        : base(localizer)
    {
        _customerService = customerService;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> RegisterAsync([FromBody] RegisterCustomerRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var result = await _customerService.RegisterCustomerAsync(request.Name, cancellationToken);

        if (!result.Succeeded)
        {
            return Problem(result, StatusCodes.Status400BadRequest);
        }

        var customer = result.Value!;
        var response = Map(customer);
        var location = Url.ActionLink(nameof(GetAsync), values: new { customerId = response.Id }) ?? $"/api/Customers/{response.Id}";

        return Created(location, response);
    }

    [HttpGet("{customerId:int}")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAsync(int customerId, CancellationToken cancellationToken)
    {
        var customer = await _customerService.GetCustomerAsync(customerId, cancellationToken);
        if (customer is null)
        {
            return NotFound();
        }

        return Ok(Map(customer));
    }

    [HttpPost("confirm")]
    [ProducesResponseType(typeof(CustomerResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ConfirmAsync([FromBody] ConfirmCustomerRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var result = await _customerService.ConfirmCustomerAsync(request.CustomerId, request.Name, cancellationToken);

        if (!result.Succeeded)
        {
            var status = result.Errors.Any(e => e.Code == ErrorCodes.CustomerNotFound)
                ? StatusCodes.Status404NotFound
                : StatusCodes.Status400BadRequest;

            return Problem(result, status);
        }

        return Ok(Map(result.Value!));
    }

    private static CustomerResponse Map(CustomerModel model)
        => new(model.Id, model.Name, model.CreatedAt);
}
