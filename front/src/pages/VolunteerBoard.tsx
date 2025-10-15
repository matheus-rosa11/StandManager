import { useCallback, useMemo, useState } from 'react';
import { advanceOrderItemStatus, fetchActiveOrders } from '../api/orders';
import { HttpError } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import { ORDER_STATUS_LABELS, describeWorkflowProgress, getStatusClass } from '../utils/orderStatus';

const POLLING_INTERVAL_MS = 5000;

const VolunteerBoard = () => {
  const loader = useCallback((signal: AbortSignal) => fetchActiveOrders(signal), []);
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
      setFeedbackMessage('Pedido atualizado com sucesso.');
      refresh();
    } catch (err) {
      if (err instanceof HttpError) {
        setFeedbackMessage(err.detail ?? err.message);
      } else {
        setFeedbackMessage('Não foi possível atualizar o pedido.');
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
        <h1>Painel dos voluntários</h1>
        <span style={{ color: 'var(--color-muted)' }}>
          Itens pendentes: <strong>{totalPendingItems}</strong>
        </span>
        <button className="button" style={{ alignSelf: 'flex-start' }} onClick={refresh} disabled={loading}>
          Atualizar agora
        </button>
        {feedbackMessage && <p style={{ color: 'var(--color-muted)' }}>{feedbackMessage}</p>}
      </header>

      {loading && !orderGroups && <p>Carregando pedidos em andamento...</p>}
      {error && <p style={{ color: '#c0392b' }}>Erro ao carregar pedidos: {error.message}</p>}

      {groupedOrders.length === 0 && !loading ? (
        <p>Não há pedidos pendentes no momento. 🎉</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groupedOrders.map((group) => {
            const isExpanded = expandedGroup === group.customerSessionId;
            const pendingCount = group.orders.reduce((acc, order) => {
              return acc + order.items.filter((item) => item.status !== 'Completed').length;
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
                    <small style={{ color: 'var(--color-muted)' }}>Sessão: {group.customerSessionId}</small>
                  </div>
                  <div>
                    <span className="status-badge status-pending">{pendingCount} itens</span>
                  </div>
                </header>

                {isExpanded && (
                  <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
                    {group.orders.map((order) => (
                      <section key={order.orderId} className="card" style={{ border: '1px dashed var(--color-border)' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Pedido #{order.orderId.slice(0, 8)}</strong>
                          <small style={{ color: 'var(--color-muted)' }}>
                            Recebido em {new Date(order.createdAt).toLocaleTimeString('pt-BR')}
                          </small>
                        </header>
                        <ul style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                          {order.items.map((item) => (
                            <li
                              key={item.itemId}
                              style={{
                                display: 'grid',
                                gap: '0.5rem',
                                gridTemplateColumns: '1.5fr 1fr auto',
                                alignItems: 'center'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600 }}>{item.flavorName}</div>
                                <small style={{ color: 'var(--color-muted)' }}>Quantidade: {item.quantity}</small>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span className={`status-badge ${getStatusClass(item.status)}`}>
                                  {ORDER_STATUS_LABELS[item.status]}
                                </span>
                                <small style={{ color: 'var(--color-muted)' }}>
                                  {describeWorkflowProgress(item.status)}
                                </small>
                              </div>
                              <button
                                className="button"
                                onClick={() => handleAdvance(order.orderId, item.itemId)}
                                disabled={item.status === 'Completed' || updatingItemId === item.itemId}
                              >
                                {item.status === 'Completed' ? 'Concluído' : 'Avançar etapa'}
                              </button>
                            </li>
                          ))}
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
