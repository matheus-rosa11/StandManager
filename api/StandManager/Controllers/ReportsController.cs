using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using StandManager.Application.Reports;
using StandManager.DTOs;
using StandManager.Localization;

namespace StandManager.Controllers;

[Route("api/[controller]")]
public class ReportsController : LocalizedControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService, IStringLocalizer<SharedResources> localizer)
        : base(localizer)
    {
        _reportService = reportService;
    }

    [HttpGet("daily")]
    [ProducesResponseType(typeof(DailyReportSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDailySummaryAsync([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var summary = await _reportService.GetDailySummaryAsync(targetDate, cancellationToken);

        var response = new DailyReportSummaryResponse(
            summary.Date,
            summary.TotalRevenue,
            summary.TotalOrders,
            summary.TotalItems,
            summary.AverageTicket,
            summary.AverageOrderCompletionSeconds,
            summary.PopularFlavors
                .Select(item => new PopularFlavorReportItem(item.FlavorId, item.FlavorName, item.Quantity, item.Revenue))
                .ToList(),
            summary.HourlyOrderCounts
                .Select(item => new HourlyOrderCountReportItem(item.Hour, item.Count))
                .ToList(),
            summary.StepDurationStats
                .Select(item => new StepDurationReportItem(item.Status, item.AverageSeconds, item.FastestSeconds, item.SlowestSeconds))
                .ToList());

        return Ok(response);
    }
}
