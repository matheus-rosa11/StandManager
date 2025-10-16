using System;
using System.Collections.Generic;

namespace StandManager.Application.Orders.Models;

public sealed record ActiveOrderModel(Guid OrderId, DateTimeOffset CreatedAt, decimal TotalAmount, IReadOnlyCollection<ActiveOrderItemModel> Items);
