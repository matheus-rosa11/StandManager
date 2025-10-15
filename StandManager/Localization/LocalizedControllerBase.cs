using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using StandManager.Application.Common.Results;

namespace StandManager.Localization;

[ApiController]
public abstract class LocalizedControllerBase : ControllerBase
{
    private readonly IStringLocalizer<SharedResources> _localizer;

    protected LocalizedControllerBase(IStringLocalizer<SharedResources> localizer)
    {
        _localizer = localizer;
    }

    protected IActionResult Problem(OperationResult result, int statusCode = StatusCodes.Status400BadRequest)
    {
        foreach (var error in result.Errors)
        {
            var message = _localizer[error.Code, error.Parameters ?? Array.Empty<object>()];
            var key = string.IsNullOrWhiteSpace(error.PropertyName) ? string.Empty : error.PropertyName!;
            ModelState.AddModelError(key, message);
        }

        var problemDetails = new ValidationProblemDetails(ModelState)
        {
            Status = statusCode
        };

        return ValidationProblem(problemDetails);
    }

    protected IStringLocalizer<SharedResources> Localizer => _localizer;

    protected IActionResult Problem<T>(OperationResult<T> result, int statusCode = StatusCodes.Status400BadRequest)
        => Problem((OperationResult)result, statusCode);
}
