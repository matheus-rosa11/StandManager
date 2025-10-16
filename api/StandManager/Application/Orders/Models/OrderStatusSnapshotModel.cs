using System;
using StandManager.Entities;

namespace StandManager.Application.Orders.Models;

public sealed record OrderStatusSnapshotModel(OrderItemStatus Status, DateTimeOffset ChangedAt);
