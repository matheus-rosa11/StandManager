using System;
using System.Collections.Generic;

namespace StandManager.Application.Orders.Models;

public sealed record OrderCreationResult(Guid OrderId, Guid CustomerSessionId, IReadOnlyCollection<OrderItemSummaryModel> Items);
