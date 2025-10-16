using System;
using System.Collections.Generic;

namespace StandManager.Application.Orders.Models;

public sealed record ActiveOrderModel(int OrderId, DateTimeOffset CreatedAt, decimal TotalAmount, IReadOnlyCollection<ActiveOrderItemModel> Items);
