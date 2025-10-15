import { useCallback, useMemo, useState } from 'react';
import { advanceOrderItemStatus, fetchActiveOrders } from '../api/orders';
import { HttpError } from '../api/client';
import { useI18n, useTranslation } from '../i18n';
import { usePolling } from '../hooks/usePolling';
import { ORDER_STATUS_LABEL_KEYS, describeWorkflowProgress, getStatusClass } from '../utils/orderStatus';

const POLLING_INTERVAL_MS = 5000;

const VolunteerBoard = () => {
  const loader = useCallback((signal: AbortSignal) => fetchActiveOrders(signal), []);
  const { t } = useTranslation();
  const { language } = useI18n();
  const { data: orderGroups, loading, error, refresh } = usePolling(loader, POLLING_INTERVAL_MS, []);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const groupedOrders = useMemo(() => orderGroups ?? [], [orderGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroup((current) => (current === groupId ? null : groupId));
  };

  const handleAdvance = async (orderId: string, itemId: string) => {
    try {
      setFeedbackMessage(null);
      setUpdatingItemId(itemId);
      await advanceOrderItemStatus(orderId, itemId);
      setFeedbackMessage(t('volunteer.success'));
      refresh();
    } catch (err) {
      if (err instanceof HttpError) {
        setFeedbackMessage(err.detail ?? err.message);
      } else {
        setFeedbackMessage(t('volunteer.genericError'));
      }
    } finally {
      setUpdatingItemId(null);
    }
  };

  const totalPendingItems = useMemo(() => {
    return groupedOrders.reduce((acc, group) => {
      const groupPending = group.orders.reduce((orderAcc, order) => {
        return (
          orderAcc +
          order.items.filter((item) => item.status !== 'Completed').reduce((sum, item) => sum + item.quantity, 0)
        );
      }, 0);
      return acc + groupPending;
    }, 0);
  }, [groupedOrders]);

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h1>{t('volunteer.title')}</h1>
        <span style={{ color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {t('volunteer.pendingItems')}: <strong>{totalPendingItems}</strong>
        </span>
        <button className="button" style={{ alignSelf: 'flex-start' }} onClick={refresh} disabled={loading}>
          {t('volunteer.refresh')}
        </button>
        {feedbackMessage && <p style={{ color: 'var(--color-muted)' }}>{feedbackMessage}</p>}
      </header>

      {loading && !orderGroups && <p>{t('volunteer.loading')}</p>}
      {error && <p style={{ color: '#c0392b' }}>{t('volunteer.error', { message: error.message })}</p>}

      {groupedOrders.length === 0 && !loading ? (
        <p>{t('volunteer.empty')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groupedOrders.map((group) => {
            const isExpanded = expandedGroup === group.customerSessionId;
            const pendingCount = group.orders.reduce((acc, order) => {
              return (
                acc +
                order.items
                  .filter((item) => item.status !== 'Completed')
                  .reduce((sum, item) => sum + item.quantity, 0)
              );
            }, 0);

            return (
              <article key={group.customerSessionId} className="card" style={{ border: '1px solid var(--color-border)' }}>
                <header
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleGroup(group.customerSessionId)}
                >
                  <div>
                    <h2>{group.customerName}</h2>
                    <small style={{ color: 'var(--color-muted)' }}>{t('volunteer.session', { sessionId: group.customerSessionId })}</small>
                  </div>
                  <div>
                    <span className="status-badge status-pending">
                      {t('volunteer.pendingPastels', { count: pendingCount })}
                    </span>
                  </div>
                </header>

                {isExpanded && (
                  <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
                    {group.orders.map((order) => (
                      <section key={order.orderId} className="card" style={{ border: '1px dashed var(--color-border)' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{t('volunteer.orderNumber', { order: order.orderId.slice(0, 8) })}</strong>
                          <small style={{ color: 'var(--color-muted)' }}>
                            {t('volunteer.receivedAt', {
                              time: new Date(order.createdAt).toLocaleTimeString(language)
                            })}
                          </small>
                        </header>
                        <ul style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                          {order.items.flatMap((item) =>
                            Array.from({ length: item.quantity }, (_, index) => ({ item, index }))
                          ).map(({ item, index }) => {
                            const unitNumber = index + 1;
                            const itemKey = `${item.itemId}-${unitNumber}`;
                            const progress = describeWorkflowProgress(item.status);
                            return (
                              <li
                                key={itemKey}
                                style={{
                                  display: 'grid',
                                  gap: '0.5rem',
                                  gridTemplateColumns: '1.5fr 1fr auto',
                                  alignItems: 'center'
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 600 }}>{item.flavorName}</div>
                                  {item.quantity > 1 && (
                                    <small style={{ color: 'var(--color-muted)' }}>
                                      {t('volunteer.unitLabel', { unit: unitNumber, total: item.quantity })}
                                    </small>
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <span className={`status-badge ${getStatusClass(item.status)}`}>
                                    {t(ORDER_STATUS_LABEL_KEYS[item.status])}
                                  </span>
                                  <small style={{ color: 'var(--color-muted)' }}>
                                    {t(progress.key, progress.params)}
                                  </small>
                                </div>
                                <button
                                  className="button"
                                  onClick={() => handleAdvance(order.orderId, item.itemId)}
                                  disabled={item.status === 'Completed' || updatingItemId === item.itemId}
                                >
                                  {item.status === 'Completed' ? t('volunteer.completed') : t('volunteer.advance')}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
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

export default VolunteerBoard;
