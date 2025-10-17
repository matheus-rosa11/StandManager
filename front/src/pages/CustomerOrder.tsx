import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, CreateOrderInput } from '../api/orders';
import { fetchPastelFlavors, PastelFlavor } from '../api/pastelFlavors';
import { HttpError } from '../api/client';
import { useI18n, useTranslation } from '../i18n';
import { usePolling } from '../hooks/usePolling';
import { useIdentity } from '../contexts/IdentityContext';

const POLLING_INTERVAL_MS = 6000;

type CartMap = Record<string, number>;

const CustomerOrder = () => {
  const loader = useCallback((signal: AbortSignal) => fetchPastelFlavors(signal), []);
  const { data: flavors, loading, error, refresh } = usePolling(loader, POLLING_INTERVAL_MS, []);
  const [cart, setCart] = useState<CartMap>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { t } = useTranslation();
  const { language } = useI18n();
  const navigate = useNavigate();
  const { state } = useIdentity();

  const customer = state.role === 'customer' ? state.customer : undefined;

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
  const isFormValid = customer !== undefined && totalItems > 0;

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' }),
    [language]
  );

  const totalAmount = useMemo(() => {
    return Object.entries(cart).reduce((acc, [flavorId, quantity]) => {
      const flavor = availableFlavors.find((item) => item.id === flavorId);
      if (!flavor) {
        return acc;
      }
      return acc + flavor.price * quantity;
    }, 0);
  }, [availableFlavors, cart]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!customer) {
      setMessage(t('customerOrder.identityMissing'));
      return;
    }

    if (totalItems === 0) {
      setMessage(t('customerOrder.validation'));
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const payload: CreateOrderInput = {
      customerId: customer.id,
      customerName: customer.name,
      items: Object.entries(cart).map(([flavorId, quantity]) => ({ pastelFlavorId: flavorId, quantity }))
    };

    try {
      await createOrder(payload);
      setShowSuccessModal(true);
      setCart({});
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

  useEffect(() => {
    if (!showSuccessModal) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSuccessModal(false);
      navigate('/self-service/orders', { replace: true });
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [navigate, showSuccessModal]);

  return (
    <section className="card" style={{ display: 'grid', gap: '1.5rem' }}>
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon modal-icon-success">
              <span>✓</span>
            </div>
            <strong>{t('customerOrder.success')}</strong>
          </div>
        </div>
      )}
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1>{t('customerOrder.title')}</h1>
        <p style={{ color: 'var(--color-muted)' }}>{t('customerOrder.subtitle')}</p>
        {customer && (
          <small style={{ color: 'var(--color-muted)' }}>
            {t('customerOrder.customerBadge', { id: customer.id, name: customer.name })}
          </small>
        )}
      </header>

      {!customer ? (
        <p style={{ color: '#c0392b' }}>{t('customerOrder.identityMissing')}</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
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
                return (
                  <article key={flavor.id} className="card" style={{ border: '1px solid var(--color-border)', display: 'grid', gap: '0.75rem' }}>
                    <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <strong>{flavor.name}</strong>
                      <small style={{ color: 'var(--color-muted)' }}>{flavor.description}</small>
                      <small style={{ color: 'var(--color-muted)' }}>
                        {t('customerOrder.inStock', { quantity: flavor.availableQuantity })}
                      </small>
                      <small style={{ color: 'var(--color-muted)' }}>{currencyFormatter.format(flavor.price)}</small>
                    </header>
                    <footer style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="quantity-input">
                        <button type="button" onClick={() => handleAdjustQuantity(flavor, -1)} disabled={selectedQuantity === 0}>
                          −
                        </button>
                        <span>{selectedQuantity}</span>
                        <button
                          type="button"
                          onClick={() => handleAdjustQuantity(flavor, 1)}
                          disabled={selectedQuantity >= flavor.availableQuantity}
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

          <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <small>{t('customerOrder.itemsInCart', { count: totalItems })}</small>
              <strong>{t('customerOrder.totalAmount', { value: currencyFormatter.format(totalAmount) })}</strong>
            </div>
            <button type="submit" className="button" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? t('customerOrder.submitting') : t('customerOrder.submit')}
            </button>
          </footer>
          {message && <p style={{ color: '#c0392b' }}>{message}</p>}
        </form>
      )}
    </section>
  );
};

export default CustomerOrder;
