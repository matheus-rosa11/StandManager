import { useCallback, useEffect, useMemo, useState } from 'react';
import { cancelOrder, CustomerOrder, fetchCustomerOrders } from '../api/orders';
import { HttpError } from '../api/client';
import { useI18n, useTranslation } from '../i18n';
import { usePolling } from '../hooks/usePolling';
import { ORDER_STATUS_LABEL_KEYS, getStatusClass } from '../utils/orderStatus';

const POLLING_INTERVAL_MS = 8000;
const SESSION_STORAGE_KEY = 'stand-manager.customer-session-id';

const CustomerOrders = () => {
  const { t } = useTranslation();
  const { language } = useI18n();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    setSessionId(stored);
  }, []);

  const loader = useCallback(
    (signal: AbortSignal) => {
      if (!sessionId) {
        return Promise.resolve([] as CustomerOrder[]);
      }
      return fetchCustomerOrders(sessionId, signal);
    },
    [sessionId]
  );

  const { data: orders, loading, error, refresh } = usePolling(loader, POLLING_INTERVAL_MS, [sessionId]);
  const [orderList, setOrderList] = useState<CustomerOrder[]>([]);

  useEffect(() => {
    if (orders) {
      setOrderList(orders);
    }
  }, [orders]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' }),
    [language]
  );

  const handleCancel = async (orderId: string) => {
    if (!sessionId) {
      return;
    }

    try {
      setCancellingId(orderId);
      setFeedback(null);
      await cancelOrder(orderId, sessionId);
      setFeedback(t('customerOrders.cancelled'));
      refresh();
    } catch (err) {
      if (err instanceof HttpError) {
        setFeedback(err.detail ?? err.message ?? t('customerOrders.cancelError'));
      } else {
        setFeedback(t('customerOrders.cancelError'));
      }
    } finally {
      setCancellingId(null);
    }
  };

  if (!sessionId) {
    return (
      <section className="card" style={{ display: 'grid', gap: '1.5rem' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h1>{t('customerOrders.title')}</h1>
          <p style={{ color: 'var(--color-muted)' }}>{t('customerOrders.noSession')}</p>
        </header>
      </section>
    );
  }

  return (
    <section className="card" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1>{t('customerOrders.title')}</h1>
        <small style={{ color: 'var(--color-muted)' }}>{t('customerOrders.sessionLabel', { sessionId })}</small>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="button" onClick={refresh} disabled={loading}>
            {t('customerOrders.refresh')}
          </button>
        </div>
        {feedback && <p style={{ color: 'var(--color-muted)' }}>{feedback}</p>}
      </header>

      {loading && !orders && <p>{t('customerOrders.loading')}</p>}
      {error && <p style={{ color: '#c0392b' }}>{t('customerOrders.error', { message: error.message })}</p>}

      {orderList.length === 0 && !loading ? (
        <p>{t('customerOrders.empty')}</p>
      ) : (
        <div className="order-grid">
          {orderList.map((order) => (
            <article key={order.orderId} className="card" style={{ border: '1px solid var(--color-border)', display: 'grid', gap: '1rem' }}>
              <header style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{t('customerOrders.orderNumber', { order: order.orderId.slice(0, 8) })}</strong>
                    <small style={{ color: 'var(--color-muted)' }}>
                      {t('customerOrders.createdAt', { time: new Date(order.createdAt).toLocaleString(language) })}
                    </small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 600 }}>{currencyFormatter.format(order.totalAmount)}</span>
                    <small style={{ display: 'block', color: 'var(--color-muted)' }}>{t('customerOrders.totalAmountLabel')}</small>
                  </div>
                </div>
                {order.isCancelable && (
                  <button
                    className="button"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() => handleCancel(order.orderId)}
                    disabled={cancellingId === order.orderId}
                  >
                    {cancellingId === order.orderId ? t('customerOrders.cancelling') : t('customerOrders.cancel')}
                  </button>
                )}
              </header>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {order.items.map((item) => (
                  <section key={item.itemId} className="card" style={{ border: '1px dashed var(--color-border)', display: 'grid', gap: '0.75rem' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <strong>{item.flavorName}</strong>
                        <small style={{ color: 'var(--color-muted)' }}>
                          {t('customerOrders.quantity', { quantity: item.quantity })}
                        </small>
                        <small style={{ color: 'var(--color-muted)' }}>
                          {t('customerOrders.unitPrice', { value: currencyFormatter.format(item.unitPrice) })}
                        </small>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
                        <span className={`status-badge ${getStatusClass(item.status)}`}>
                          {t(ORDER_STATUS_LABEL_KEYS[item.status])}
                        </span>
                        {item.lastUpdatedAt && (
                          <small style={{ color: 'var(--color-muted)' }}>
                            {t('customerOrders.lastUpdated', { time: new Date(item.lastUpdatedAt).toLocaleTimeString(language) })}
                          </small>
                        )}
                      </div>
                    </header>
                    <div>
                      <strong>{t('customerOrders.timeline')}</strong>
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

export default CustomerOrders;
