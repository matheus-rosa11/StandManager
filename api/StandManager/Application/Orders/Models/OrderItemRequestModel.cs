using System;

namespace StandManager.Application.Orders.Models;

public sealed record OrderItemRequestModel(Guid PastelFlavorId, int Quantity, string? Notes);
