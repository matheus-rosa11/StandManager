using StandManager.Entities;

namespace StandManager.DTOs;

public record DailyReportSummaryResponse(
    DateOnly Date,
    decimal TotalRevenue,
    int TotalOrders,
    int TotalItems,
    decimal AverageTicket,
    double? AverageOrderCompletionSeconds,
    IReadOnlyCollection<PopularFlavorReportItem> PopularFlavors,
    IReadOnlyCollection<HourlyOrderCountReportItem> HourlyOrderCounts,
    IReadOnlyCollection<StepDurationReportItem> StepDurationStats);

public record PopularFlavorReportItem(Guid FlavorId, string FlavorName, int Quantity, decimal Revenue);

public record HourlyOrderCountReportItem(int Hour, int Count);

public record StepDurationReportItem(OrderItemStatus Status, double AverageSeconds, double FastestSeconds, double SlowestSeconds);
