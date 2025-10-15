using System;
using System.Collections.Generic;

namespace StandManager.Application.Orders.Models;

public sealed record ActiveOrderModel(Guid OrderId, DateTimeOffset CreatedAt, IReadOnlyCollection<ActiveOrderItemModel> Items);
