using System.Collections.Generic;
using StandManager.Entities;

namespace StandManager.Application.Reports.Models;

public sealed record PopularFlavorModel(Guid FlavorId, string FlavorName, int Quantity, decimal Revenue);

public sealed record HourlyOrderCountModel(int Hour, int Count);

public sealed record StepDurationStatModel(OrderItemStatus Status, double AverageSeconds, double FastestSeconds, double SlowestSeconds);

public sealed record DailyReportSummaryModel(
    DateOnly Date,
    decimal TotalRevenue,
    int TotalOrders,
    int TotalItems,
    decimal AverageTicket,
    double? AverageOrderCompletionSeconds,
    IReadOnlyCollection<PopularFlavorModel> PopularFlavors,
    IReadOnlyCollection<HourlyOrderCountModel> HourlyOrderCounts,
    IReadOnlyCollection<StepDurationStatModel> StepDurationStats);
