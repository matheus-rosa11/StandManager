import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createOrder } from '../api/orders';
import { fetchPastelFlavors, PastelFlavor } from '../api/pastelFlavors';
import { HttpError } from '../api/client';
import { useTranslation } from '../i18n';
import { usePolling } from '../hooks/usePolling';

const POLLING_INTERVAL_MS = 6000;
const SESSION_STORAGE_KEY = 'stand-manager.customer-session-id';

type CartMap = Record<string, number>;

const CustomerOrder = () => {
  const loader = useCallback((signal: AbortSignal) => fetchPastelFlavors(signal), []);
  const { data: flavors, loading, error, refresh } = usePolling(loader, POLLING_INTERVAL_MS, []);
  const [customerName, setCustomerName] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [cart, setCart] = useState<CartMap>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY) ?? undefined;
    setSessionId(storedSessionId || undefined);
  }, []);

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
      setMessage(t('customerOrder.validation'));
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);
      const payload = {
        customerName: customerName.trim(),
        customerSessionId: sessionId,
        items: Object.entries(cart).map(([flavorId, quantity]) => ({ pastelFlavorId: flavorId, quantity }))
      };

      const result = await createOrder(payload);
      setMessage(t('customerOrder.success'));
      setCart({});
      setCustomerName('');
      const resolvedSessionId = result.customerSessionId ?? sessionId;
      if (resolvedSessionId) {
        setSessionId(resolvedSessionId);
        localStorage.setItem(SESSION_STORAGE_KEY, resolvedSessionId);
      }
      refresh();
    } catch (err) {
      if (err instanceof HttpError) {
        const validationMessage = Object.values(err.errors ?? {}).flat().join(' ');
        setMessage(validationMessage || err.detail || err.message);
      } else {
        setMessage(t('customerOrder.failure'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card" style={{ display: 'grid', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1>{t('customerOrder.title')}</h1>
        <p style={{ color: 'var(--color-muted)' }}>{t('customerOrder.subtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
        <div>
          <label htmlFor="customerName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            {t('customerOrder.nameLabel')}
          </label>
          <input
            id="customerName"
            type="text"
            placeholder={t('customerOrder.namePlaceholder')}
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
        </div>

        {sessionId && (
          <p style={{ color: 'var(--color-muted)' }}>{t('customerOrder.sessionMessage', { sessionId })}</p>
        )}

        <div style={{ display: 'grid', gap: '1rem' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{t('customerOrder.availableFlavors')}</h2>
            <button type="button" className="button" onClick={refresh} disabled={loading}>
              {t('customerOrder.refresh')}
            </button>
          </header>

          {loading && !flavors && <p>{t('customerOrder.loading')}</p>}
          {error && <p style={{ color: '#c0392b' }}>{t('customerOrder.error', { message: error.message })}</p>}

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {availableFlavors.map((flavor) => {
              const selectedQuantity = cart[flavor.id] ?? 0;
              const isOutOfStock = flavor.availableQuantity === 0;
              return (
                <article key={flavor.id} className="card" style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                  {flavor.imageUrl && (
                    <img
                      src={flavor.imageUrl}
                      alt={`Pastel sabor ${flavor.name}`}
                      style={{ width: '100%', borderRadius: '0.75rem', marginBottom: '0.75rem' }}
                    />
                  )}
                  <strong>{flavor.name}</strong>
                  {flavor.description && <small style={{ color: 'var(--color-muted)' }}>{flavor.description}</small>}
                  <span style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
                    {t('customerOrder.inStock', { quantity: flavor.availableQuantity })}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
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
                </article>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>{t('customerOrder.itemsInCart', { count: totalItems })}</div>
          <button type="submit" className="button" disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? t('customerOrder.submitting') : t('customerOrder.submit')}
          </button>
        </div>

        {message && <p style={{ color: 'var(--color-muted)' }}>{message}</p>}
      </form>
    </section>
  );
};

export default CustomerOrder;
