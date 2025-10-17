import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { advanceOrderItemStatus, fetchActiveOrders } from '../api/orders';
import { HttpError } from '../api/client';
import { useI18n, useTranslation } from '../i18n';
import { usePolling } from '../hooks/usePolling';
import { ORDER_STATUS_LABEL_KEYS, describeWorkflowProgress, getStatusClass } from '../utils/orderStatus';

const POLLING_INTERVAL_MS = 5000;

const VolunteerBoard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const loader = useCallback((signal: AbortSignal) => fetchActiveOrders(debouncedSearch, signal), [debouncedSearch]);
  const { t } = useTranslation();
  const { language } = useI18n();
  const { data: orderGroups, loading, error, refresh } = usePolling(loader, POLLING_INTERVAL_MS, []);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [finalizingItems, setFinalizingItems] = useState<Record<string, number>>({});
  const finalizingTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      Object.values(finalizingTimers.current).forEach((timerId) => window.clearTimeout(timerId));
      finalizingTimers.current = {};
    };
  }, []);

  const groupedOrders = useMemo(() => orderGroups ?? [], [orderGroups]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' }),
    [language]
  );

  const toggleGroup = (groupId: number) => {
    setExpandedGroup((current) => (current === groupId ? null : groupId));
  };

  const handleAdvance = async (orderId: number, itemId: string) => {
    try {
      setFeedbackMessage(null);
      setUpdatingItemId(itemId);
      const result = await advanceOrderItemStatus(orderId, itemId);
      setFeedbackMessage(t('volunteer.success'));

      if (result.status === 'Completed') {
        setFinalizingItems((current) => ({ ...current, [itemId]: result.quantity }));
        const timerId = window.setTimeout(() => {
          setFinalizingItems((current) => {
            const { [itemId]: _removed, ...rest } = current;
            return rest;
          });
          refresh();
          delete finalizingTimers.current[itemId];
        }, 1600);
        finalizingTimers.current[itemId] = timerId;
      } else {
        refresh();
      }
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
    const base = groupedOrders.reduce((acc, group) => {
      const groupPending = group.orders.reduce((orderAcc, order) => {
        return (
          orderAcc +
          order.items
            .filter((item) => item.status !== 'Completed' && item.status !== 'Cancelled')
            .reduce((sum, item) => sum + item.quantity, 0)
        );
      }, 0);
      return acc + groupPending;
    }, 0);

    const finalizingCount = Object.values(finalizingItems).reduce((acc, quantity) => acc + quantity, 0);
    return Math.max(base - finalizingCount, 0);
  }, [finalizingItems, groupedOrders]);

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h1>{t('volunteer.title')}</h1>
        <span style={{ color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {t('volunteer.pendingItems')}: <strong>{totalPendingItems}</strong>
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t('volunteer.searchPlaceholder')}
          style={{ maxWidth: '320px' }}
        />
        <button className="button" style={{ alignSelf: 'flex-start' }} onClick={refresh} disabled={loading}>
          {t('volunteer.refresh')}
        </button>
        <div style={{ minHeight: '1.25rem' }}>
          {feedbackMessage && <p style={{ color: 'var(--color-muted)' }}>{feedbackMessage}</p>}
        </div>
      </header>

      {loading && !orderGroups && <p>{t('volunteer.loading')}</p>}
      {error && <p style={{ color: '#c0392b' }}>{t('volunteer.error', { message: error.message })}</p>}

      {groupedOrders.length === 0 && !loading ? (
        <p>{t('volunteer.empty')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groupedOrders.map((group) => {
            const isExpanded = expandedGroup === group.customerId;
            const pendingCount = group.orders.reduce((acc, order) => {
              return (
                acc +
                order.items
                  .filter((item) => item.status !== 'Completed' && item.status !== 'Cancelled')
                  .reduce((sum, item) => sum + item.quantity, 0)
              );
            }, 0);

            return (
              <article key={group.customerId} className="card" style={{ border: '1px solid var(--color-border)' }}>
                <header
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleGroup(group.customerId)}
                >
                  <div>
                    <h2>{group.customerName}</h2>
                    <small style={{ color: 'var(--color-muted)' }}>{t('volunteer.identifier', { id: group.customerId })}</small>
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
                        <header
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong>{t('volunteer.orderNumber', { order: order.orderId })}</strong>
                            <small style={{ color: 'var(--color-muted)' }}>
                              {t('volunteer.receivedAt', {
                                time: new Date(order.createdAt).toLocaleTimeString(language)
                              })}
                            </small>
                          </div>
                          <small style={{ color: 'var(--color-muted)', fontWeight: 600 }}>
                            {t('volunteer.orderTotal', { value: currencyFormatter.format(order.totalAmount) })}
                          </small>
                        </header>
                        <ul style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                          {order.items.flatMap((item) =>
                            Array.from({ length: item.quantity }, (_, index) => ({ item, index }))
                          ).map(({ item, index }) => {
                            const unitNumber = index + 1;
                            const itemKey = `${item.itemId}-${unitNumber}`;
                            const progress = describeWorkflowProgress(item.status);
                            const isFinalizing = finalizingItems[item.itemId] !== undefined;
                            return (
                              <li
                                key={itemKey}
                                className="volunteer-item-row"
                              >
                                <div className="volunteer-item-row__info">
                                  <div style={{ fontWeight: 600 }}>{item.flavorName}</div>
                                  {item.quantity > 1 && (
                                    <small style={{ color: 'var(--color-muted)' }}>
                                      {t('volunteer.unitLabel', { unit: unitNumber, total: item.quantity })}
                                    </small>
                                  )}
                                </div>
                                {isFinalizing ? (
                                  <div className="volunteer-item-row__finalized">
                                    <span aria-hidden="true">✓</span>
                                    <span>{t('volunteer.finalizedMessage')}</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="volunteer-item-row__status">
                                      <span className={`status-badge ${getStatusClass(item.status)}`}>
                                        {t(ORDER_STATUS_LABEL_KEYS[item.status])}
                                      </span>
                                      <small style={{ color: 'var(--color-muted)' }}>
                                        {t(progress.key, progress.params)}
                                      </small>
                                    </div>
                                    <div className="volunteer-item-row__actions">
                                      <button
                                        className="button"
                                        onClick={() => handleAdvance(order.orderId, item.itemId)}
                                        disabled={updatingItemId === item.itemId}
                                      >
                                        {t('volunteer.advance')}
                                      </button>
                                    </div>
                                  </>
                                )}
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
