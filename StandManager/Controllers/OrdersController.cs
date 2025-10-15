using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StandManager.Data;
using StandManager.DTOs;
using StandManager.Entities;
using StandManager.Services;

namespace StandManager.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly StandManagerDbContext _dbContext;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(StandManagerDbContext dbContext, ILogger<OrdersController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(OrderCreatedResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (request.Items is null || request.Items.Count == 0)
        {
            ModelState.AddModelError(nameof(request.Items), "At least one pastel flavor must be included in the order.");
            return ValidationProblem(ModelState);
        }

        var normalizedName = request.CustomerName.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName))
        {
            ModelState.AddModelError(nameof(request.CustomerName), "Customer name is required.");
            return ValidationProblem(ModelState);
        }

        var itemGroups = request.Items
            .GroupBy(i => i.PastelFlavorId)
            .Select(group => new
            {
                FlavorId = group.Key,
                Quantity = group.Sum(g => g.Quantity),
                Items = group.ToList()
            })
            .ToList();

        var flavorIds = itemGroups.Select(g => g.FlavorId).ToList();
        var flavors = await _dbContext.PastelFlavors
            .Where(f => flavorIds.Contains(f.Id))
            .ToDictionaryAsync(f => f.Id, cancellationToken);

        if (flavors.Count != flavorIds.Count)
        {
            ModelState.AddModelError(nameof(request.Items), "One or more flavors could not be found.");
            return ValidationProblem(ModelState);
        }

        foreach (var group in itemGroups)
        {
            var flavor = flavors[group.FlavorId];
            if (flavor.AvailableQuantity < group.Quantity)
            {
                ModelState.AddModelError(nameof(request.Items), $"Flavor '{flavor.Name}' is out of stock for the requested quantity.");
            }
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        CustomerSession session;
        if (request.CustomerSessionId.HasValue)
        {
            session = await _dbContext.CustomerSessions
                .FirstOrDefaultAsync(c => c.Id == request.CustomerSessionId.Value, cancellationToken);

            if (session is null)
            {
                ModelState.AddModelError(nameof(request.CustomerSessionId), "Customer session was not found.");
                return ValidationProblem(ModelState);
            }

            if (!string.Equals(session.DisplayName, normalizedName, StringComparison.Ordinal))
            {
                session.DisplayName = normalizedName;
            }
        }
        else
        {
            session = new CustomerSession
            {
                DisplayName = normalizedName
            };
            _dbContext.CustomerSessions.Add(session);
        }

        var order = new Order
        {
            CustomerSession = session,
            CustomerNameSnapshot = normalizedName
        };

        foreach (var group in itemGroups)
        {
            var flavor = flavors[group.FlavorId];
            flavor.AvailableQuantity -= group.Quantity;

            foreach (var item in group.Items)
            {
                order.Items.Add(new OrderItem
                {
                    PastelFlavorId = item.PastelFlavorId,
                    Quantity = item.Quantity,
                    Notes = item.Notes?.Trim()
                });
            }
        }

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation("Order {OrderId} created for session {SessionId} ({CustomerName})", order.Id, session.Id, session.DisplayName);

        var response = new OrderCreatedResponse(order.Id, session.Id, order.Items
            .Select(i => new OrderItemSummary(i.Id, i.PastelFlavorId, i.Quantity, i.Status))
            .ToList());

        return CreatedAtAction(nameof(GetActiveAsync), null, response);
    }

    [HttpGet("active")]
    [ProducesResponseType(typeof(IEnumerable<ActiveOrderGroupResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveAsync(CancellationToken cancellationToken)
    {
        var orders = await _dbContext.Orders
            .AsNoTracking()
            .Where(o => o.Items.Any(i => i.Status != OrderItemStatus.Completed))
            .Select(o => new
            {
                o.Id,
                o.CustomerSessionId,
                CustomerName = o.CustomerSession.DisplayName,
                o.CreatedAt,
                Items = o.Items
                    .Where(i => i.Status != OrderItemStatus.Completed)
                    .OrderBy(i => i.CreatedAt)
                    .Select(i => new
                    {
                        i.Id,
                        i.PastelFlavorId,
                        FlavorName = i.PastelFlavor.Name,
                        i.Quantity,
                        i.Status,
                        i.CreatedAt,
                        i.LastUpdatedAt
                    })
                    .ToList()
            })
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        var grouped = orders
            .GroupBy(o => new { o.CustomerSessionId, o.CustomerName })
            .Select(group => new ActiveOrderGroupResponse(
                group.Key.CustomerSessionId,
                group.Key.CustomerName,
                group.Select(order => new ActiveOrderResponse(
                    order.Id,
                    order.CreatedAt,
                    order.Items.Select(item => new ActiveOrderItemResponse(
                        item.Id,
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

        return Ok(grouped);
    }

    [HttpPost("{orderId:guid}/items/{itemId:guid}/advance")]
    [ProducesResponseType(typeof(ActiveOrderItemResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> AdvanceItemStatusAsync(Guid orderId, Guid itemId, [FromBody] AdvanceOrderItemRequest request, CancellationToken cancellationToken)
    {
        var item = await _dbContext.OrderItems
            .Include(i => i.Order)
            .ThenInclude(o => o.CustomerSession)
            .Include(i => i.PastelFlavor)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.OrderId == orderId, cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        if (item.Status == OrderItemStatus.Completed)
        {
            ModelState.AddModelError(nameof(item.Status), "Item has already been completed.");
            return ValidationProblem(ModelState);
        }

        var targetStatus = request?.TargetStatus;
        if (targetStatus.HasValue)
        {
            if (!OrderWorkflowService.IsValidForwardTransition(item.Status, targetStatus.Value) || targetStatus.Value == item.Status)
            {
                ModelState.AddModelError(nameof(AdvanceOrderItemRequest.TargetStatus), "Invalid status transition.");
                return ValidationProblem(ModelState);
            }
        }
        else
        {
            var next = OrderWorkflowService.GetNextStatus(item.Status);
            if (!next.HasValue)
            {
                ModelState.AddModelError(nameof(AdvanceOrderItemRequest.TargetStatus), "Item is already at the final stage.");
                return ValidationProblem(ModelState);
            }

            targetStatus = next.Value;
        }

        item.Status = targetStatus.Value;
        item.LastUpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Order item {OrderItemId} for order {OrderId} advanced to status {Status}", item.Id, orderId, item.Status);

        var response = new ActiveOrderItemResponse(
            item.Id,
            item.PastelFlavorId,
            item.PastelFlavor.Name,
            item.Quantity,
            item.Status,
            item.CreatedAt,
            item.LastUpdatedAt);

        return Ok(response);
    }
}
