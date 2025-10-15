import { ChangeEvent } from 'react';
import { LanguageCode, useI18n, useTranslation } from '../i18n';

const LanguageSelector = () => {
  const { language, languages, setLanguage } = useI18n();
  const { t } = useTranslation();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as LanguageCode);
  };

  return (
    <label className="language-selector">
      <span className="sr-only">{t('languageSelector.label')}</span>
      <select value={language} onChange={handleChange} aria-label={t('languageSelector.label')}>
        {languages.map((option) => (
          <option key={option.code} value={option.code}>
            {`${option.icon} ${t(option.labelKey)}`}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSelector;

