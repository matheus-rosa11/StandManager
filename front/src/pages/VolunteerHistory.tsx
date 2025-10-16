import { useCallback, useMemo } from 'react';
import { fetchOrderHistory } from '../api/orders';
import { useI18n, useTranslation } from '../i18n';
import { usePolling } from '../hooks/usePolling';
import { ORDER_STATUS_LABEL_KEYS, getStatusClass } from '../utils/orderStatus';

const POLLING_INTERVAL_MS = 20000;

const VolunteerHistory = () => {
  const { t } = useTranslation();
  const { language } = useI18n();

  const loader = useCallback((signal: AbortSignal) => fetchOrderHistory(signal), []);
  const { data, loading, error, refresh } = usePolling(loader, POLLING_INTERVAL_MS, []);

  const groups = useMemo(() => data ?? [], [data]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' }),
    [language]
  );

  return (
    <section className="card" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1>{t('volunteerHistory.title')}</h1>
        <p style={{ color: 'var(--color-muted)' }}>{t('volunteerHistory.subtitle')}</p>
        <button className="button" onClick={refresh} disabled={loading}>
          {t('volunteerHistory.refresh')}
        </button>
      </header>

      {loading && !data && <p>{t('volunteerHistory.loading')}</p>}
      {error && <p style={{ color: '#c0392b' }}>{t('volunteerHistory.error', { message: error.message })}</p>}

      {groups.length === 0 && !loading ? (
        <p>{t('volunteerHistory.empty')}</p>
      ) : (
        <div className="order-grid">
          {groups.map((group) => (
            <article key={group.customerSessionId} className="card" style={{ border: '1px solid var(--color-border)', display: 'grid', gap: '1.25rem' }}>
              <header style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <strong>{group.customerName}</strong>
                <small style={{ color: 'var(--color-muted)' }}>{t('volunteerHistory.session', { sessionId: group.customerSessionId })}</small>
              </header>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {group.orders.map((order) => (
                  <section key={order.orderId} className="card" style={{ border: '1px dashed var(--color-border)', display: 'grid', gap: '0.75rem' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{t('volunteerHistory.orderNumber', { order: order.orderId.slice(0, 8) })}</strong>
                        <small style={{ color: 'var(--color-muted)' }}>
                          {t('volunteerHistory.createdAt', { time: new Date(order.createdAt).toLocaleString(language) })}
                        </small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 600 }}>{currencyFormatter.format(order.totalAmount)}</span>
                        <small style={{ display: 'block', color: 'var(--color-muted)' }}>{t('volunteerHistory.totalAmountLabel')}</small>
                      </div>
                    </header>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {order.items.map((item) => (
                        <div key={item.itemId} className="card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)', display: 'grid', gap: '0.75rem' }}>
                          <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <strong>{item.flavorName}</strong>
                              <small style={{ color: 'var(--color-muted)' }}>{t('volunteerHistory.quantity', { quantity: item.quantity })}</small>
                              <small style={{ color: 'var(--color-muted)' }}>{t('volunteerHistory.unitPrice', { value: currencyFormatter.format(item.unitPrice) })}</small>
                            </div>
                            <span className={`status-badge ${getStatusClass(item.history[item.history.length - 1]?.status ?? 'Pending')}`}>
                              {t(ORDER_STATUS_LABEL_KEYS[item.history[item.history.length - 1]?.status ?? 'Pending'])}
                            </span>
                          </header>
                          <div>
                            <strong>{t('volunteerHistory.timeline')}</strong>
                            <div className="timeline">
                              {item.history.map((entry, index) => {
                                const isLast = index === item.history.length - 1;
                                return (
                                  <div key={`${entry.status}-${entry.changedAt}`} className="timeline-item">
                                    {!isLast && <span className="timeline-divider" aria-hidden />}
                                    <div className="timeline-content">
                                      <span className={`status-badge ${getStatusClass(entry.status)}`}>
                                        {t(ORDER_STATUS_LABEL_KEYS[entry.status])}
                                      </span>
                                      <small style={{ color: 'var(--color-muted)' }}>
                                        {new Date(entry.changedAt).toLocaleString(language)}
                                      </small>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default VolunteerHistory;
