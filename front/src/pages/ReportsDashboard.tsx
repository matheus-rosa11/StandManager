import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { fetchDailyReport, DailyReportSummary } from '../api/reports';
import { useI18n, useTranslation } from '../i18n';
import { HttpError } from '../api/client';
import { ORDER_STATUS_LABEL_KEYS } from '../utils/orderStatus';

const ReportsDashboard = () => {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [report, setReport] = useState<DailyReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { language } = useI18n();

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDailyReport(selectedDate, controller.signal);
        setReport(data);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          if (err instanceof HttpError) {
            setError(err.detail ?? err.message ?? t('reports.loadError'));
          } else {
            setError(t('reports.loadError'));
          }
        }
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [selectedDate, t]);

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const averageDuration = useMemo(() => {
    if (!report?.averageOrderCompletionSeconds) {
      return t('reports.noCompletionData');
    }
    const totalSeconds = report.averageOrderCompletionSeconds;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }, [report?.averageOrderCompletionSeconds, t]);

  const chartPoints = useMemo(() => {
    if (!report || report.hourlyOrderCounts.length === 0) {
      return '';
    }

    const width = 640;
    const height = 240;
    const maxCount = Math.max(...report.hourlyOrderCounts.map((item) => item.count), 1);
    const pointCount = report.hourlyOrderCounts.length;

    return report.hourlyOrderCounts
      .map((item, index) => {
        const x = pointCount === 1 ? width / 2 : (index / (pointCount - 1)) * width;
        const y = height - (item.count / maxCount) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [report]);

  return (
    <section className="card" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h1>{t('reports.title')}</h1>
        <p style={{ color: 'var(--color-muted)' }}>{t('reports.subtitle')}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label htmlFor="report-date" style={{ fontWeight: 600 }}>
            {t('reports.dateLabel')}
          </label>
          <input
            id="report-date"
            type="date"
            value={selectedDate}
            max={today}
            onChange={handleDateChange}
          />
        </div>
      </header>

      {loading && <p>{t('reports.loading')}</p>}
      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      {report && !loading && !error && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section className="card" style={{ border: '1px solid var(--color-border)', display: 'grid', gap: '1rem' }}>
            <h2>{t('reports.summaryTitle')}</h2>
            <div className="stat-grid">
              <div className="stat-card">
                <strong>{t('reports.totalRevenue')}</strong>
                <span>{new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' }).format(report.totalRevenue)}</span>
              </div>
              <div className="stat-card">
                <strong>{t('reports.totalOrders')}</strong>
                <span>{report.totalOrders}</span>
              </div>
              <div className="stat-card">
                <strong>{t('reports.totalItems')}</strong>
                <span>{report.totalItems}</span>
              </div>
              <div className="stat-card">
                <strong>{t('reports.averageTicket')}</strong>
                <span>{new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' }).format(report.averageTicket)}</span>
              </div>
              <div className="stat-card">
                <strong>{t('reports.averageCompletion')}</strong>
                <span>{averageDuration}</span>
              </div>
            </div>
          </section>

          <section className="card" style={{ border: '1px solid var(--color-border)', display: 'grid', gap: '1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{t('reports.hourlyChartTitle')}</h2>
              <small style={{ color: 'var(--color-muted)' }}>{t('reports.hourlyChartSubtitle')}</small>
            </header>
            {report.hourlyOrderCounts.length === 0 ? (
              <p>{t('reports.noOrders')}</p>
            ) : (
              <svg viewBox="0 0 640 240" role="img" aria-label={t('reports.hourlyChartTitle')}>
                <polyline
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={3}
                  points={chartPoints}
                />
                {report.hourlyOrderCounts.map((item, index) => {
                  const pointCount = report.hourlyOrderCounts.length;
                  const width = 640;
                  const height = 240;
                  const maxCount = Math.max(...report.hourlyOrderCounts.map((value) => value.count), 1);
                  const x = pointCount === 1 ? width / 2 : (index / (pointCount - 1)) * width;
                  const y = height - (item.count / maxCount) * height;
                  return (
                    <g key={item.hour}>
                      <circle cx={x} cy={y} r={4} fill="var(--color-accent)" />
                      <text x={x} y={height + 16} textAnchor="middle" style={{ fontSize: '0.65rem', fill: 'var(--color-muted)' }}>
                        {`${item.hour}:00`}
                      </text>
                      <text x={x} y={y - 8} textAnchor="middle" style={{ fontSize: '0.65rem', fill: 'var(--color-muted)' }}>
                        {item.count}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </section>

          <section className="card" style={{ border: '1px solid var(--color-border)', display: 'grid', gap: '1rem' }}>
            <h2>{t('reports.popularFlavorsTitle')}</h2>
            {report.popularFlavors.length === 0 ? (
              <p>{t('reports.noFlavorData')}</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('reports.flavorColumn')}</th>
                    <th>{t('reports.quantityColumn')}</th>
                    <th>{t('reports.revenueColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.popularFlavors.map((flavor) => (
                    <tr key={flavor.flavorId}>
                      <td>{flavor.flavorName}</td>
                      <td>{flavor.quantity}</td>
                      <td>{new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' }).format(flavor.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card" style={{ border: '1px solid var(--color-border)', display: 'grid', gap: '1rem' }}>
            <h2>{t('reports.stepDurationsTitle')}</h2>
            {report.stepDurationStats.length === 0 ? (
              <p>{t('reports.noStepData')}</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('reports.stepColumn')}</th>
                    <th>{t('reports.averageColumn')}</th>
                    <th>{t('reports.fastestColumn')}</th>
                    <th>{t('reports.slowestColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.stepDurationStats.map((stat) => (
                    <tr key={stat.status}>
                      <td>{t(ORDER_STATUS_LABEL_KEYS[stat.status])}</td>
                      <td>{t('reports.durationFormat', { seconds: Math.round(stat.averageSeconds) })}</td>
                      <td>{t('reports.durationFormat', { seconds: Math.round(stat.fastestSeconds) })}</td>
                      <td>{t('reports.durationFormat', { seconds: Math.round(stat.slowestSeconds) })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </section>
  );
};

export default ReportsDashboard;
