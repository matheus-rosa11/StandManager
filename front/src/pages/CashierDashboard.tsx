import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders';
import { fetchPastelFlavors, PastelFlavor } from '../api/pastelFlavors';
import { HttpError } from '../api/client';
import { useI18n, useTranslation } from '../i18n';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { t } = useTranslation();
  const { language } = useI18n();
  const navigate = useNavigate();

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

  const isFormValid = customerName.trim().length > 0 && totalItems > 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isFormValid) {
      setFeedback(t('cashier.validation'));
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
      setShowSuccessModal(true);
      setFeedback(null);
      setCustomerName('');
      setCart({});
      refresh();
    } catch (err) {
      if (err instanceof HttpError) {
        const validationMessage = Object.values(err.errors ?? {}).flat().join(' ');
        setFeedback(validationMessage || err.detail || err.message);
      } else {
        setFeedback(t('cashier.failure'));
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
      navigate('/cashier/novo', { replace: true });
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [navigate, showSuccessModal]);

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon modal-icon-success">
              <span>✓</span>
            </div>
            <strong>{t('cashier.successModal')}</strong>
          </div>
        </div>
      )}
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h1>{t('cashier.title')}</h1>
        <p style={{ color: 'var(--color-muted)' }}>{t('cashier.subtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
        <div>
          <label htmlFor="customerName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            {t('cashier.nameLabel')}
          </label>
          <input
            id="customerName"
            type="text"
            placeholder={t('cashier.namePlaceholder')}
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{t('cashier.availableFlavors')}</h2>
            <button type="button" className="button" onClick={refresh} disabled={loading}>
              {t('cashier.refresh')}
            </button>
          </header>

          {loading && !flavors && <p>{t('cashier.loading')}</p>}
          {error && <p style={{ color: '#c0392b' }}>{t('cashier.error', { message: error.message })}</p>}

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {availableFlavors.map((flavor) => {
              const selectedQuantity = cart[flavor.id] ?? 0;
              const isOutOfStock = flavor.availableQuantity === 0;

              return (
                <article key={flavor.id} className="card pastel-card" style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                  <header className="pastel-card__header">
                    <strong>{flavor.name}</strong>
                    {flavor.description && <small style={{ color: 'var(--color-muted)' }}>{flavor.description}</small>}
                    <small style={{ color: 'var(--color-muted)', fontWeight: 600 }}>
                      {currencyFormatter.format(flavor.price)}
                    </small>
                  </header>
                  {flavor.imageUrl && (
                    <img
                      src={flavor.imageUrl}
                      alt={`Foto do pastel sabor ${flavor.name}`}
                      className="pastel-card__image"
                    />
                  )}
                  <footer className="pastel-card__footer">
                    <div className="pastel-card__meta">
                      <small style={{ fontWeight: 600 }}>{currencyFormatter.format(flavor.price)}</small>
                      <small>{t('cashier.inStock', { quantity: flavor.availableQuantity })}</small>
                    </div>
                    <div className="pastel-card__actions">
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>{t('cashier.totalPastels', { count: totalItems })}</span>
            <small style={{ color: 'var(--color-muted)', fontWeight: 600 }}>
              {t('cashier.totalAmount', { value: currencyFormatter.format(totalAmount) })}
            </small>
          </div>
          <button type="submit" className="button" disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? t('cashier.submitting') : t('cashier.submit')}
          </button>
        </div>

        {feedback && <p style={{ color: 'var(--color-muted)' }}>{feedback}</p>}
      </form>
    </section>
  );
};

export default CashierDashboard;
