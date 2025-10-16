import { useCallback, useMemo, useState } from 'react';
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
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setExpandedGroup((current) => (current === groupId ? null : groupId));
  };

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
          {groups.map((group) => {
            const isExpanded = expandedGroup === group.customerSessionId;
            const completedCount = group.orders.reduce((acc, order) => {
              return acc + order.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0);
            }, 0);

            return (
              <article key={group.customerSessionId} className="card" style={{ border: '1px solid var(--color-border)', display: 'grid', gap: '1rem' }}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`history-group-${group.customerSessionId}`}
                  onClick={() => toggleGroup(group.customerSessionId)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'inherit'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <strong>{group.customerName}</strong>
                    <small style={{ color: 'var(--color-muted)' }}>{t('volunteerHistory.session', { sessionId: group.customerSessionId })}</small>
                  </div>
                  <span className="status-badge status-readyforpickup">
                    {t('volunteerHistory.completedItems', { count: completedCount })}
                  </span>
                </button>

                {isExpanded && (
                  <div id={`history-group-${group.customerSessionId}`} style={{ display: 'grid', gap: '1rem' }}>
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
                          {order.items.map((item) => {
                            const lastStatus = item.history[item.history.length - 1]?.status ?? 'Pending';
                            return (
                              <div key={item.itemId} className="card" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)', display: 'grid', gap: '0.75rem' }}>
                                <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <strong>{item.flavorName}</strong>
                                    <small style={{ color: 'var(--color-muted)' }}>{t('volunteerHistory.quantity', { quantity: item.quantity })}</small>
                                    <small style={{ color: 'var(--color-muted)' }}>{t('volunteerHistory.unitPrice', { value: currencyFormatter.format(item.unitPrice) })}</small>
                                  </div>
                                  <span className={`status-badge ${getStatusClass(lastStatus)}`}>
                                    {t(ORDER_STATUS_LABEL_KEYS[lastStatus])}
                                  </span>
                                </header>
                                <div>
                                  <strong>{t('volunteerHistory.timeline')}</strong>
                                  <ul className="history-list">
                                    {item.history.map((entry) => (
                                      <li key={`${entry.status}-${entry.changedAt}`}>
                                        <span className={`status-badge ${getStatusClass(entry.status)}`}>
                                          {t(ORDER_STATUS_LABEL_KEYS[entry.status])}
                                        </span>
                                        <small>{new Date(entry.changedAt).toLocaleString(language)}</small>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default VolunteerHistory;
