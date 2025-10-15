import { FormEvent, useCallback, useMemo, useState } from 'react';
import { createOrder } from '../api/orders';
import { fetchPastelFlavors, PastelFlavor } from '../api/pastelFlavors';
import { HttpError } from '../api/client';
import { usePolling } from '../hooks/usePolling';

const POLLING_INTERVAL_MS = 7000;

type CartMap = Record<string, number>;

const CashierDashboard = () => {
  const loader = useCallback((signal: AbortSignal) => fetchPastelFlavors(signal), []);
  const { data: flavors, loading, error, refresh } = usePolling(loader, POLLING_INTERVAL_MS, []);
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState<CartMap>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableFlavors = useMemo(() => flavors ?? [], [flavors]);

  const handleAdjustQuantity = (flavor: PastelFlavor, delta: number) => {
    setCart((current) => {
      const currentQuantity = current[flavor.id] ?? 0;
      const nextQuantity = Math.min(Math.max(currentQuantity + delta, 0), flavor.availableQuantity);
      if (nextQuantity === 0) {
        const { [flavor.id]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [flavor.id]: nextQuantity };
    });
  };

  const totalItems = useMemo(() => Object.values(cart).reduce((acc, value) => acc + value, 0), [cart]);

  const isFormValid = customerName.trim().length > 0 && totalItems > 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFormValid) {
      setFeedback('Informe o nome do cliente e selecione pelo menos um pastel.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      const payload = {
        customerName: customerName.trim(),
        items: Object.entries(cart).map(([flavorId, quantity]) => ({ pastelFlavorId: flavorId, quantity }))
      };

      await createOrder(payload);
      setFeedback('Pedido registrado com sucesso!');
      setCustomerName('');
      setCart({});
      refresh();
    } catch (err) {
      if (err instanceof HttpError) {
        const validationMessage = Object.values(err.errors ?? {}).flat().join(' ');
        setFeedback(validationMessage || err.detail || err.message);
      } else {
        setFeedback('Não foi possível registrar o pedido. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h1>Registro de pedidos - Caixa</h1>
        <p style={{ color: 'var(--color-muted)' }}>
          Consulte o estoque atualizado e selecione rapidamente os sabores solicitados pelos participantes.
        </p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
        <div>
          <label htmlFor="customerName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Nome do cliente
          </label>
          <input
            id="customerName"
            type="text"
            placeholder="Ex: Maria Silva"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Sabores disponíveis</h2>
            <button type="button" className="button" onClick={refresh} disabled={loading}>
              Atualizar estoque
            </button>
          </header>

          {loading && !flavors && <p>Carregando sabores disponíveis...</p>}
          {error && <p style={{ color: '#c0392b' }}>Erro ao consultar sabores: {error.message}</p>}

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {availableFlavors.map((flavor) => {
              const selectedQuantity = cart[flavor.id] ?? 0;
              const isOutOfStock = flavor.availableQuantity === 0;

              return (
                <article key={flavor.id} className="card" style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                  <header style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <strong>{flavor.name}</strong>
                    {flavor.description && <small style={{ color: 'var(--color-muted)' }}>{flavor.description}</small>}
                  </header>
                  {flavor.imageUrl && (
                    <img
                      src={flavor.imageUrl}
                      alt={`Foto do pastel sabor ${flavor.name}`}
                      style={{ width: '100%', borderRadius: '0.75rem', marginTop: '0.75rem' }}
                    />
                  )}
                  <footer style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Em estoque: {flavor.availableQuantity}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="button"
                        onClick={() => handleAdjustQuantity(flavor, -1)}
                        disabled={selectedQuantity === 0}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '2ch', textAlign: 'center', fontWeight: 600 }}>{selectedQuantity}</span>
                      <button
                        type="button"
                        className="button"
                        onClick={() => handleAdjustQuantity(flavor, 1)}
                        disabled={isOutOfStock || selectedQuantity >= flavor.availableQuantity}
                      >
                        +
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Total de pastéis:</strong> {totalItems}
          </div>
          <button type="submit" className="button" disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Registrar pedido'}
          </button>
        </div>

        {feedback && <p style={{ color: 'var(--color-muted)' }}>{feedback}</p>}
      </form>
    </section>
  );
};

export default CashierDashboard;
