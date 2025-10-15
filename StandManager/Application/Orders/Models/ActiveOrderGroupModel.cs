using System;
using System.Collections.Generic;

namespace StandManager.Application.Orders.Models;

public sealed record ActiveOrderGroupModel(Guid CustomerSessionId, string CustomerName, IReadOnlyCollection<ActiveOrderModel> Orders);
