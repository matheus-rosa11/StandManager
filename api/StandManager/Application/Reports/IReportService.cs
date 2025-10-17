using System.Threading;
using System.Threading.Tasks;
using StandManager.Application.Reports.Models;

namespace StandManager.Application.Reports;

public interface IReportService
{
    Task<DailyReportSummaryModel> GetDailySummaryAsync(DateOnly date, CancellationToken cancellationToken);
}
