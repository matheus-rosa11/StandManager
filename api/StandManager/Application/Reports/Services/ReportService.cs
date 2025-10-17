using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StandManager.Application.Reports.Models;
using StandManager.Data;
using StandManager.Entities;

namespace StandManager.Application.Reports.Services;

public sealed class ReportService : IReportService
{
    private readonly StandManagerDbContext _dbContext;

    public ReportService(StandManagerDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DailyReportSummaryModel> GetDailySummaryAsync(DateOnly date, CancellationToken cancellationToken)
    {
        var start = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        var end = start.AddDays(1);

        var ordersQuery = _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.CreatedAt >= start && order.CreatedAt < end);

        var totalOrders = await ordersQuery.CountAsync(cancellationToken);
        var totalRevenue = await ordersQuery.SumAsync(order => order.TotalAmount, cancellationToken);

        var itemsQuery = _dbContext.OrderItems
            .AsNoTracking()
            .Where(item => item.Order.CreatedAt >= start && item.Order.CreatedAt < end && item.Status != OrderItemStatus.Cancelled);

        var totalItems = await itemsQuery.CountAsync(cancellationToken);

        var averageTicket = totalOrders == 0 ? 0m : decimal.Round(totalRevenue / totalOrders, 2);

        var popularFlavorsData = await itemsQuery
            .GroupBy(item => new { item.PastelFlavorId, item.PastelFlavor.Name })
            .Select(group => new
            {
                group.Key.PastelFlavorId,
                group.Key.Name,
                Quantity = group.Count(),
                Revenue = group.Sum(item => item.UnitPrice)
            })
            .OrderByDescending(group => group.Quantity)
            .ThenBy(group => group.Name)
            .ToListAsync(cancellationToken);

        var popularFlavors = popularFlavorsData
            .Select(group => new PopularFlavorModel(group.PastelFlavorId, group.Name, group.Quantity, decimal.Round(group.Revenue, 2)))
            .ToList();

        var hourlyCountsData = await ordersQuery
            .GroupBy(order => order.CreatedAt.Hour)
            .Select(group => new { Hour = group.Key, Count = group.Count() })
            .OrderBy(group => group.Hour)
            .ToListAsync(cancellationToken);

        var hourlyCounts = hourlyCountsData
            .Select(group => new HourlyOrderCountModel(group.Hour, group.Count))
            .ToList();

        var ordersWithHistory = await _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.CreatedAt >= start && order.CreatedAt < end)
            .Select(order => new
            {
                order.Id,
                order.CreatedAt,
                Items = order.Items.Select(item => new
                {
                    item.Id,
                    Histories = item.StatusHistory
                        .OrderBy(history => history.ChangedAt)
                        .Select(history => new { history.Status, history.ChangedAt })
                        .ToList()
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        var completionDurations = new List<TimeSpan>();
        var durationsByStatus = new Dictionary<OrderItemStatus, List<TimeSpan>>();

        foreach (var order in ordersWithHistory)
        {
            DateTimeOffset? completion = null;

            foreach (var item in order.Items)
            {
                var histories = item.Histories.OrderBy(history => history.ChangedAt).ToList();
                for (var index = 0; index < histories.Count - 1; index++)
                {
                    var current = histories[index];
                    var next = histories[index + 1];
                    var delta = next.ChangedAt - current.ChangedAt;

                    if (delta < TimeSpan.Zero)
                    {
                        continue;
                    }

                    var status = NormalizeStatus(current.Status);
                    if (!durationsByStatus.TryGetValue(status, out var list))
                    {
                        list = new List<TimeSpan>();
                        durationsByStatus[status] = list;
                    }

                    list.Add(delta);
                }

                var completed = histories.LastOrDefault(history => NormalizeStatus(history.Status) == OrderItemStatus.Completed);
                if (completed is not null)
                {
                    if (completion is null || completed.ChangedAt > completion)
                    {
                        completion = completed.ChangedAt;
                    }
                }
            }

            if (completion is not null)
            {
                completionDurations.Add(completion.Value - order.CreatedAt);
            }
        }

        double? averageCompletionSeconds = completionDurations.Count == 0
            ? null
            : completionDurations.Average(duration => duration.TotalSeconds);

        var stepStats = durationsByStatus
            .Select(pair => new StepDurationStatModel(
                pair.Key,
                pair.Value.Average(duration => duration.TotalSeconds),
                pair.Value.Min(duration => duration.TotalSeconds),
                pair.Value.Max(duration => duration.TotalSeconds)))
            .OrderByDescending(stat => stat.AverageSeconds)
            .ToList();

        return new DailyReportSummaryModel(
            date,
            decimal.Round(totalRevenue, 2),
            totalOrders,
            totalItems,
            averageTicket,
            averageCompletionSeconds,
            popularFlavors,
            hourlyCounts,
            stepStats);
    }

    private static OrderItemStatus NormalizeStatus(OrderItemStatus status)
        => status switch
        {
            OrderItemStatus.Packaging => OrderItemStatus.Frying,
            OrderItemStatus.OutForDelivery => OrderItemStatus.ReadyForPickup,
            _ => status
        };
}
