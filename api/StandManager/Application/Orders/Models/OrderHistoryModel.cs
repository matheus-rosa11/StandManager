using System;
using System.Collections.Generic;

namespace StandManager.Application.Orders.Models;

public sealed record OrderHistoryGroupModel(
    Guid CustomerSessionId,
    string CustomerName,
    IReadOnlyCollection<OrderHistoryOrderModel> Orders);

public sealed record OrderHistoryOrderModel(
    Guid OrderId,
    DateTimeOffset CreatedAt,
    decimal TotalAmount,
    IReadOnlyCollection<OrderHistoryItemModel> Items);

public sealed record OrderHistoryItemModel(
    Guid OrderItemId,
    Guid PastelFlavorId,
    string FlavorName,
    int Quantity,
    decimal UnitPrice,
    IReadOnlyCollection<OrderStatusSnapshotModel> History);
