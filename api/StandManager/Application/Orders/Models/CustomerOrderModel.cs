using System;
using System.Collections.Generic;

namespace StandManager.Application.Orders.Models;

public sealed record CustomerOrderModel(
    Guid OrderId,
    DateTimeOffset CreatedAt,
    decimal TotalAmount,
    bool IsCancelable,
    IReadOnlyCollection<CustomerOrderItemModel> Items);

public sealed record CustomerOrderItemModel(
    Guid OrderItemId,
    Guid PastelFlavorId,
    string FlavorName,
    int Quantity,
    decimal UnitPrice,
    Entities.OrderItemStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastUpdatedAt,
    IReadOnlyCollection<OrderStatusSnapshotModel> History);
