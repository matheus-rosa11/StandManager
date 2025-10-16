import { FormEvent, useMemo, useState } from 'react';
import { createPastelFlavorsBatch, CreatePastelFlavorPayload, PastelFlavor } from '../api/pastelFlavors';
import { HttpError } from '../api/client';
import { useI18n, useTranslation } from '../i18n';

interface PastelDraft {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  availableQuantity: string;
  price: string;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const createEmptyDraft = (): PastelDraft => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: '',
  description: '',
  imageUrl: '',
  availableQuantity: '',
  price: ''
});

const AdminPastelManager = () => {
  const { t } = useTranslation();
  const { language } = useI18n();
  const [drafts, setDrafts] = useState<PastelDraft[]>([createEmptyDraft()]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pendingReview, setPendingReview] = useState<CreatePastelFlavorPayload[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdFlavors, setCreatedFlavors] = useState<PastelFlavor[]>([]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' }),
    [language]
  );

  const handleDraftChange = (draftId: string, field: keyof Omit<PastelDraft, 'id'>, value: string) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              [field]: value
            }
          : draft
      )
    );
    setFeedback(null);
  };

  const handleAddDraft = () => {
    setDrafts((current) => [...current, createEmptyDraft()]);
    setFeedback(null);
  };

  const handleRemoveDraft = (draftId: string) => {
    setDrafts((current) => {
      const filtered = current.filter((draft) => draft.id !== draftId);
      if (filtered.length === 0) {
        return [createEmptyDraft()];
      }
      return filtered;
    });
    setFeedback(null);
  };

  const parseDrafts = (): CreatePastelFlavorPayload[] | null => {
    if (drafts.length === 0) {
      setFeedback({ type: 'error', message: t('adminPastels.validationItems') });
      return null;
    }

    const normalized: CreatePastelFlavorPayload[] = [];
    const seenNames = new Set<string>();

    for (const draft of drafts) {
      const name = draft.name.trim();
      if (!name) {
        setFeedback({ type: 'error', message: t('adminPastels.validationName') });
        return null;
      }

      const normalizedKey = name.toLocaleLowerCase();
      if (seenNames.has(normalizedKey)) {
        setFeedback({ type: 'error', message: t('adminPastels.validationDuplicate', { name }) });
        return null;
      }
      seenNames.add(normalizedKey);

      const parsedQuantity = Number.parseInt(draft.availableQuantity, 10);
      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
        setFeedback({ type: 'error', message: t('adminPastels.validationQuantity') });
        return null;
      }

      const normalizedPriceString = draft.price.replace(',', '.');
      const parsedPrice = Number.parseFloat(normalizedPriceString);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        setFeedback({ type: 'error', message: t('adminPastels.validationPrice') });
        return null;
      }

      normalized.push({
        name,
        description: draft.description.trim() || undefined,
        imageUrl: draft.imageUrl.trim() || undefined,
        availableQuantity: parsedQuantity,
        price: Number.parseFloat(parsedPrice.toFixed(2))
      });
    }

    return normalized;
  };

  const handleOpenReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = parseDrafts();
    if (!normalized) {
      return;
    }

    setFeedback(null);
    setPendingReview(normalized);
    setShowReviewModal(true);
    setCreatedFlavors([]);
  };

  const handleConfirm = async () => {
    if (pendingReview.length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await createPastelFlavorsBatch(pendingReview);
      setFeedback({
        type: 'success',
        message: t('adminPastels.success', { count: response.length })
      });
      setCreatedFlavors(response);
      setDrafts([createEmptyDraft()]);
      setPendingReview([]);
      setShowReviewModal(false);
    } catch (error) {
      if (error instanceof HttpError) {
        const validationMessage = Object.values(error.errors ?? {}).flat().join(' ');
        setFeedback({
          type: 'error',
          message: validationMessage || error.detail || error.message
        });
      } else {
        setFeedback({ type: 'error', message: t('adminPastels.error') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card" style={{ display: 'grid', gap: '1.5rem' }}>
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px', width: '100%', textAlign: 'left' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>{t('adminPastels.reviewTitle')}</h2>
            <p style={{ color: 'var(--color-muted)', marginBottom: '1rem' }}>{t('adminPastels.reviewDescription')}</p>

            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                      {t('adminPastels.nameLabel')}
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                      {t('adminPastels.reviewQuantity')}
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                      {t('adminPastels.reviewPrice')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReview.map((item, index) => (
                    <tr key={`${item.name}-${index}`}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                        <strong>{item.name}</strong>
                        {item.description && (
                          <div style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            {item.description}
                          </div>
                        )}
                        {item.imageUrl && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                            {item.imageUrl}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>{item.availableQuantity}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                        {currencyFormatter.format(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="button" onClick={() => setShowReviewModal(false)} disabled={isSubmitting}>
                {t('adminPastels.editButton')}
              </button>
              <button type="button" className="button" onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? t('adminPastels.submitting') : t('adminPastels.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h1>{t('adminPastels.title')}</h1>
        <p style={{ color: 'var(--color-muted)' }}>{t('adminPastels.subtitle')}</p>
      </header>

      {feedback && (
        <div
          role="alert"
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '0.75rem',
            border: '1px solid',
            borderColor: feedback.type === 'success' ? 'rgba(39, 174, 96, 0.35)' : 'rgba(192, 57, 43, 0.35)',
            backgroundColor: feedback.type === 'success' ? 'rgba(39, 174, 96, 0.08)' : 'rgba(192, 57, 43, 0.08)'
          }}
        >
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{feedback.message}</strong>
          {feedback.type === 'success' && createdFlavors.length > 0 && (
            <ul style={{ paddingLeft: '1.25rem', display: 'grid', gap: '0.25rem' }}>
              {createdFlavors.map((flavor) => (
                <li key={flavor.id}>{t('adminPastels.successItem', { name: flavor.name, quantity: flavor.availableQuantity })}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleOpenReview} style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {drafts.map((draft, index) => (
            <div
              key={draft.id}
              className="card"
              style={{ display: 'grid', gap: '1rem', padding: '1.25rem', position: 'relative' }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-muted)'
                }}
              >
                #{index + 1}
              </span>

              <div>
                <label htmlFor={`flavor-name-${draft.id}`} className="required" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {t('adminPastels.nameLabel')}
                </label>
                <input
                  id={`flavor-name-${draft.id}`}
                  type="text"
                  value={draft.name}
                  onChange={(event) => handleDraftChange(draft.id, 'name', event.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor={`flavor-description-${draft.id}`} style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {t('adminPastels.descriptionLabel')}
                </label>
                <textarea
                  id={`flavor-description-${draft.id}`}
                  value={draft.description}
                  onChange={(event) => handleDraftChange(draft.id, 'description', event.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label htmlFor={`flavor-image-${draft.id}`} style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {t('adminPastels.imageLabel')}
                </label>
                <input
                  id={`flavor-image-${draft.id}`}
                  type="url"
                  value={draft.imageUrl}
                  onChange={(event) => handleDraftChange(draft.id, 'imageUrl', event.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div>
                  <label htmlFor={`flavor-quantity-${draft.id}`} style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    {t('adminPastels.quantityLabel')}
                  </label>
                  <input
                    id={`flavor-quantity-${draft.id}`}
                    type="number"
                    min={0}
                    value={draft.availableQuantity}
                    onChange={(event) => handleDraftChange(draft.id, 'availableQuantity', event.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor={`flavor-price-${draft.id}`} style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    {t('adminPastels.priceLabel')}
                  </label>
                  <input
                    id={`flavor-price-${draft.id}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.price}
                    onChange={(event) => handleDraftChange(draft.id, 'price', event.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="button" onClick={() => handleRemoveDraft(draft.id)}>
                  {t('adminPastels.removeFlavor')}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="button" onClick={handleAddDraft}>
            {t('adminPastels.addFlavor')}
          </button>
          <button type="submit" className="button">
            {t('adminPastels.reviewButton')}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AdminPastelManager;
