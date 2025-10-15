using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using StandManager.DTOs;
using StandManager.Application.Common.Errors;
using StandManager.Application.Orders;
using StandManager.Application.Orders.Models;
using StandManager.Localization;

namespace StandManager.Controllers;

[Route("api/[controller]")]
public class OrdersController : LocalizedControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService, IStringLocalizer<SharedResources> localizer)
        : base(localizer)
    {
        _orderService = orderService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(OrderCreatedResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var items = (request.Items ?? Array.Empty<OrderItemRequest>())
            .Select(item => new OrderItemRequestModel(item.PastelFlavorId, item.Quantity, item.Notes))
            .ToList();

        var result = await _orderService.CreateOrderAsync(
            request.CustomerName,
            request.CustomerSessionId,
            items,
            cancellationToken);

        if (!result.Succeeded)
        {
            var status = result.Errors.Any(e => e.Code == ErrorCodes.CustomerSessionNotFound || e.Code == ErrorCodes.FlavorNotFound)
                ? StatusCodes.Status404NotFound
                : StatusCodes.Status400BadRequest;

            return Problem(result, status);
        }

        var payload = result.Value!;
        var response = new OrderCreatedResponse(
            payload.OrderId,
            payload.CustomerSessionId,
            payload.Items.Select(i => new OrderItemSummary(i.OrderItemId, i.PastelFlavorId, i.Quantity, i.Status)).ToList());

        return CreatedAtAction(nameof(GetActiveAsync), null, response);
    }

    [HttpGet("active")]
    [ProducesResponseType(typeof(IEnumerable<ActiveOrderGroupResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveAsync(CancellationToken cancellationToken)
    {
        var result = await _orderService.GetActiveOrdersAsync(cancellationToken);
        var response = result
            .Select(group => new ActiveOrderGroupResponse(
                group.CustomerSessionId,
                group.CustomerName,
                group.Orders.Select(order => new ActiveOrderResponse(
                    order.OrderId,
                    order.CreatedAt,
                    order.Items.Select(item => new ActiveOrderItemResponse(
                        item.OrderItemId,
                        item.PastelFlavorId,
                        item.FlavorName,
                        item.Quantity,
                        item.Status,
                        item.CreatedAt,
                        item.LastUpdatedAt
                    )).ToList()
                )).ToList()
            ))
            .ToList();

        return Ok(response);
    }

    [HttpPost("{orderId:guid}/items/{itemId:guid}/advance")]
    [ProducesResponseType(typeof(ActiveOrderItemResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> AdvanceItemStatusAsync(Guid orderId, Guid itemId, [FromBody] AdvanceOrderItemRequest request, CancellationToken cancellationToken)
    {
        var result = await _orderService.AdvanceOrderItemStatusAsync(orderId, itemId, request?.TargetStatus, cancellationToken);

        if (!result.Succeeded)
        {
            var status = result.Errors.Any(e => e.Code == ErrorCodes.OrderItemNotFound)
                ? StatusCodes.Status404NotFound
                : StatusCodes.Status400BadRequest;

            return Problem(result, status);
        }

        var item = result.Value!;
        var response = new ActiveOrderItemResponse(
            item.OrderItemId,
            item.PastelFlavorId,
            item.FlavorName,
            item.Quantity,
            item.Status,
            item.CreatedAt,
            item.LastUpdatedAt);

        return Ok(response);
    }
}
