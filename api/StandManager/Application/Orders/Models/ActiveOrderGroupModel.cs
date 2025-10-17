using System;
using System.Collections.Generic;

namespace StandManager.Application.Orders.Models;

public sealed record ActiveOrderGroupModel(int CustomerId, string CustomerName, IReadOnlyCollection<ActiveOrderModel> Orders);
