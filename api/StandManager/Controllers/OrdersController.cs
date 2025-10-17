using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var items = (request.Items ?? Array.Empty<OrderItemRequest>())
                .Select(item => new OrderItemRequestModel(item.PastelFlavorId, item.Quantity, item.Notes))
                .ToList();

            var result = await _orderService.CreateOrderAsync(
                request.CustomerId,
                request.CustomerName,
                items,
                cancellationToken);

            if (!result.Succeeded)
            {
                var status = result.Errors.Any(e => e.Code == ErrorCodes.CustomerNotFound || e.Code == ErrorCodes.FlavorNotFound)
                    ? StatusCodes.Status404NotFound
                    : StatusCodes.Status400BadRequest;

                return Problem(result, status);
            }

            var payload = result.Value!;
            var response = new OrderCreatedResponse(
                payload.OrderId,
                payload.CustomerId,
                payload.TotalAmount,
                payload.Items
                    .Select(item => new OrderItemSummary(item.OrderItemId, item.PastelFlavorId, item.Quantity, item.Status, item.UnitPrice))
                    .ToList());

            var location = Url.ActionLink(nameof(GetActiveAsync)) ?? "/api/Orders/active";

            return Created(location, response);
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

    [HttpGet("active")]
    [ProducesResponseType(typeof(IEnumerable<ActiveOrderGroupResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveAsync([FromQuery] string? search, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _orderService.GetActiveOrdersAsync(search, cancellationToken);
            var response = result
                .Select(group => new ActiveOrderGroupResponse(
                    group.CustomerId,
                    group.CustomerName,
                    group.Orders.Select(order => new ActiveOrderResponse(
                        order.OrderId,
                        order.CreatedAt,
                        order.TotalAmount,
                        order.Items.Select(item => new ActiveOrderItemResponse(
                            item.OrderItemId,
                            item.PastelFlavorId,
                            item.FlavorName,
                            item.Quantity,
                            item.UnitPrice,
                            item.Status,
                            item.CreatedAt,
                            item.LastUpdatedAt
                        )).ToList()
                    )).ToList()
                ))
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

    [HttpPost("{orderId:int}/items/{itemId:guid}/advance")]
    [ProducesResponseType(typeof(ActiveOrderItemResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> AdvanceItemStatusAsync(int orderId, Guid itemId, [FromBody] AdvanceOrderItemRequest request, CancellationToken cancellationToken)
    {
        try
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
                item.UnitPrice,
                item.Status,
                item.CreatedAt,
                item.LastUpdatedAt);

            return Ok(response);
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

    [HttpGet("customer/{customerId:int}")]
    [ProducesResponseType(typeof(IEnumerable<CustomerOrderResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByCustomerAsync(int customerId, CancellationToken cancellationToken)
    {
        try
        {
            var orders = await _orderService.GetCustomerOrdersAsync(customerId, cancellationToken);
            var response = orders
                .Select(order => new CustomerOrderResponse(
                    order.OrderId,
                    order.CreatedAt,
                    order.TotalAmount,
                    order.IsCancelable,
                    order.Items
                        .Select(item => new CustomerOrderItemResponse(
                            item.OrderItemId,
                            item.PastelFlavorId,
                            item.FlavorName,
                            item.Quantity,
                            item.UnitPrice,
                            item.Status,
                            item.CreatedAt,
                            item.LastUpdatedAt,
                            item.History
                                .Select(history => new OrderStatusSnapshotResponse(history.Status, history.ChangedAt))
                                .ToList()
                        ))
                        .ToList()
                ))
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

    [HttpPost("{orderId:int}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CancelAsync(int orderId, [FromBody] CancelOrderRequest request, CancellationToken cancellationToken)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var result = await _orderService.CancelOrderAsync(orderId, request.CustomerId, cancellationToken);

            if (!result.Succeeded)
            {
                var status = result.Errors.Any(e => e.Code == ErrorCodes.OrderNotFound)
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

    [HttpGet("history")]
    [ProducesResponseType(typeof(IEnumerable<OrderHistoryGroupResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistoryAsync([FromQuery] string? search, CancellationToken cancellationToken)
    {
        try
        {
            var history = await _orderService.GetOrderHistoryAsync(search, cancellationToken);
            var response = history
                .Select(group => new OrderHistoryGroupResponse(
                    group.CustomerId,
                    group.CustomerName,
                    group.Orders
                        .Select(order => new OrderHistoryOrderResponse(
                            order.OrderId,
                            order.CreatedAt,
                            order.TotalAmount,
                            order.Items
                                .Select(item => new OrderHistoryItemResponse(
                                    item.OrderItemId,
                                    item.PastelFlavorId,
                                    item.FlavorName,
                                    item.Quantity,
                                    item.UnitPrice,
                                    item.History
                                        .Select(historyEntry => new OrderStatusSnapshotResponse(historyEntry.Status, historyEntry.ChangedAt))
                                        .ToList()
                                ))
                                .ToList()
                        ))
                        .ToList()
                ))
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
}
