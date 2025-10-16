import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cancelOrder, CustomerOrder, fetchCustomerOrders } from '../api/orders';
import { HttpError } from '../api/client';
import { useI18n, useTranslation } from '../i18n';
import { usePolling } from '../hooks/usePolling';
import { ORDER_STATUS_LABEL_KEYS, OrderItemStatus, getStatusClass } from '../utils/orderStatus';

const POLLING_INTERVAL_MS = 8000;
const SESSION_STORAGE_KEY = 'stand-manager.customer-session-id';

const CustomerOrders = () => {
  const { t } = useTranslation();
  const { language } = useI18n();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
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

  const previousStatusesRef = useRef<Map<string, OrderItemStatus>>(new Map());

  useEffect(() => {
    if (!orderList) {
      return;
    }

    const previous = previousStatusesRef.current;
    const next = new Map<string, OrderItemStatus>();

    orderList.forEach((order) => {
      order.items.forEach((item) => {
        const key = `${order.orderId}:${item.itemId}`;
        const lastStatus = previous.get(key);
        if (item.status === 'OutForDelivery' && lastStatus !== 'OutForDelivery') {
          setNotification(t('customerOrders.notificationOutForDelivery', { order: order.orderId.slice(0, 8) }));
        }
        next.set(key, item.status);
      });
    });

    previousStatusesRef.current = next;
  }, [orderList, t]);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timer = window.setTimeout(() => setNotification(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notification]);

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
          {notification && <span className="status-badge status-outfordelivery">{notification}</span>}
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
