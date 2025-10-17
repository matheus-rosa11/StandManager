import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmCustomer, fetchCustomer, registerCustomer } from '../api/customers';
import { HttpError } from '../api/client';
import { useIdentity } from '../contexts/IdentityContext';
import { useTranslation } from '../i18n';

type Step =
  | 'idle'
  | 'askRole'
  | 'askIdentifier'
  | 'enterIdentifier'
  | 'confirmName'
  | 'enterName'
  | 'completed';

const IdentityGate = () => {
  const { state, becomeCustomer, becomeVolunteer } = useIdentity();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('askRole');
  const [identifier, setIdentifier] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [pendingCustomerName, setPendingCustomerName] = useState<string | null>(null);
  const [pendingCustomerId, setPendingCustomerId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const shouldBlock = useMemo(() => {
    if (successMessage) {
      return true;
    }

    return state.role === null;
  }, [state.role, successMessage]);

  useEffect(() => {
    if (state.role === 'customer' || state.role === 'volunteer') {
      setStep('completed');
    } else {
      setStep('askRole');
    }
  }, [state.role]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage(null);
      navigate('/self-service', { replace: true });
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [successMessage, navigate]);

  if (!shouldBlock) {
    return null;
  }

  const resetToInitial = () => {
    setIdentifier('');
    setNameInput('');
    setPendingCustomerId(null);
    setPendingCustomerName(null);
    setErrorMessage(null);
  };

  const handleVolunteer = () => {
    becomeVolunteer();
    setStep('completed');
  };

  const handleHasIdentifier = (hasIdentifier: boolean) => {
    resetToInitial();
    setStep(hasIdentifier ? 'enterIdentifier' : 'enterName');
  };

  const handleLookupIdentifier = async (event: FormEvent) => {
    event.preventDefault();
    const parsedId = Number.parseInt(identifier.trim(), 10);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setErrorMessage(t('identity.identifierInvalid'));
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const customer = await fetchCustomer(parsedId);
      setPendingCustomerId(customer.id);
      setPendingCustomerName(customer.name);
      setStep('confirmName');
    } catch (err) {
      if (err instanceof HttpError) {
        setErrorMessage(err.detail ?? err.message ?? t('identity.identifierInvalid'));
      } else {
        setErrorMessage(t('identity.identifierInvalid'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmName = async (event: FormEvent) => {
    event.preventDefault();
    if (!pendingCustomerId) {
      return;
    }
    const normalized = nameInput.trim();
    if (!normalized) {
      setErrorMessage(t('identity.nameRequired'));
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const customer = await confirmCustomer(pendingCustomerId, normalized);
      becomeCustomer({ id: customer.id, name: customer.name });
      setSuccessMessage(t('identity.customerWelcome', { id: customer.id, name: customer.name }));
      setStep('completed');
    } catch (err) {
      if (err instanceof HttpError) {
        const fallback = err.errors ? Object.values(err.errors).flat().join(' ') : null;
        setErrorMessage(fallback || err.detail || err.message || t('identity.nameMismatch'));
      } else {
        setErrorMessage(t('identity.nameMismatch'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCustomer = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = nameInput.trim();
    if (!normalized) {
      setErrorMessage(t('identity.nameRequired'));
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const customer = await registerCustomer(normalized);
      becomeCustomer({ id: customer.id, name: customer.name });
      setSuccessMessage(t('identity.customerWelcome', { id: customer.id, name: customer.name }));
      setStep('completed');
    } catch (err) {
      if (err instanceof HttpError) {
        const fallback = err.errors ? Object.values(err.errors).flat().join(' ') : null;
        setErrorMessage(fallback || err.detail || err.message || t('identity.registerFailed'));
      } else {
        setErrorMessage(t('identity.registerFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (successMessage) {
      return (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <h2>{successMessage}</h2>
          <p style={{ color: 'var(--color-muted)' }}>{t('identity.persistReminder')}</p>
        </div>
      );
    }

    switch (step) {
      case 'askRole':
        return (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h2>{t('identity.askRoleTitle')}</h2>
            <p style={{ color: 'var(--color-muted)' }}>{t('identity.askRoleSubtitle')}</p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button className="button" onClick={handleVolunteer}>
                {t('identity.imVolunteer')}
              </button>
              <button
                className="button"
                onClick={() => {
                  resetToInitial();
                  setStep('askIdentifier');
                }}
              >
                {t('identity.imGuest')}
              </button>
            </div>
          </div>
        );
      case 'askIdentifier':
        return (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h2>{t('identity.askIdentifierTitle')}</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button className="button" onClick={() => handleHasIdentifier(true)}>
                {t('identity.hasIdentifierYes')}
              </button>
              <button className="button" onClick={() => handleHasIdentifier(false)}>
                {t('identity.hasIdentifierNo')}
              </button>
            </div>
          </div>
        );
      case 'enterIdentifier':
        return (
          <form onSubmit={handleLookupIdentifier} style={{ display: 'grid', gap: '1rem' }}>
            <h2>{t('identity.enterIdentifierTitle')}</h2>
            <input
              type="number"
              min={1}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={t('identity.identifierPlaceholder')}
              required
            />
            <button className="button" type="submit" disabled={loading}>
              {loading ? t('identity.loading') : t('identity.continue')}
            </button>
          </form>
        );
      case 'confirmName':
        return (
          <form onSubmit={handleConfirmName} style={{ display: 'grid', gap: '1rem' }}>
            <h2>{t('identity.confirmNameTitle', { id: pendingCustomerId ?? '' })}</h2>
            <p style={{ color: 'var(--color-muted)' }}>{t('identity.confirmNameSubtitle', { name: pendingCustomerName ?? '' })}</p>
            <input
              type="text"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder={t('identity.namePlaceholder')}
              required
            />
            <button className="button" type="submit" disabled={loading}>
              {loading ? t('identity.loading') : t('identity.confirmNameButton')}
            </button>
          </form>
        );
      case 'enterName':
        return (
          <form onSubmit={handleRegisterCustomer} style={{ display: 'grid', gap: '1rem' }}>
            <h2>{t('identity.enterNameTitle')}</h2>
            <p style={{ color: 'var(--color-muted)' }}>{t('identity.enterNameSubtitle')}</p>
            <input
              type="text"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder={t('identity.namePlaceholder')}
              required
            />
            <button className="button" type="submit" disabled={loading}>
              {loading ? t('identity.loading') : t('identity.createIdentifierButton')}
            </button>
            <button type="button" className="button button-secondary" onClick={() => handleHasIdentifier(true)}>
              {t('identity.alreadyHaveIdentifier')}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <section className="modal-card" style={{ maxWidth: '420px', display: 'grid', gap: '1rem' }}>
        {renderContent()}
        {errorMessage && <p style={{ color: '#c0392b' }}>{errorMessage}</p>}
        {step === 'askRole' && (
          <button className="button button-secondary" onClick={() => handleHasIdentifier(true)}>
            {t('identity.hasIdentifierQuestion')}
          </button>
        )}
      </section>
    </div>
  );
};

export default IdentityGate;
