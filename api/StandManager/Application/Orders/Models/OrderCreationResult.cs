using System;
using System.Collections.Generic;

namespace StandManager.Application.Orders.Models;

public sealed record OrderCreationResult(int OrderId, int CustomerId, decimal TotalAmount, IReadOnlyCollection<OrderItemSummaryModel> Items);
