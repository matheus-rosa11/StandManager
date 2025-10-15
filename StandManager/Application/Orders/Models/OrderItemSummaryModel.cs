using System;
using StandManager.Entities;

namespace StandManager.Application.Orders.Models;

public sealed record OrderItemSummaryModel(Guid OrderItemId, Guid PastelFlavorId, int Quantity, OrderItemStatus Status);
