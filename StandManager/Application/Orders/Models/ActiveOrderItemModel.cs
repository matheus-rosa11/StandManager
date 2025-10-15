using System;
using StandManager.Entities;

namespace StandManager.Application.Orders.Models;

public sealed record ActiveOrderItemModel(
    Guid OrderItemId,
    Guid PastelFlavorId,
    string FlavorName,
    int Quantity,
    OrderItemStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastUpdatedAt);
