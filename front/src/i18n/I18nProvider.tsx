import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  LanguageCode,
  LanguageOption,
  TranslateParams,
  getCurrentLanguage,
  getLanguageOptions,
  setCurrentLanguage,
  subscribeLanguage,
  translate
} from './translator';

export interface I18nContextValue {
  language: LanguageCode;
  languages: LanguageOption[];
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, params?: TranslateParams) => string;
}

const defaultLanguage = getCurrentLanguage();
const defaultValue: I18nContextValue = {
  language: defaultLanguage,
  languages: getLanguageOptions(),
  setLanguage: () => undefined,
  t: (key: string, params?: TranslateParams) => translate(key, params, defaultLanguage)
};

const I18nContext = createContext<I18nContextValue>(defaultValue);

export const I18nProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [language, setLanguageState] = useState<LanguageCode>(() => getCurrentLanguage());

  useEffect(() => subscribeLanguage(setLanguageState), []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const handleChange = useCallback((next: LanguageCode) => {
    setCurrentLanguage(next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      languages: getLanguageOptions(),
      setLanguage: handleChange,
      t: (key: string, params?: TranslateParams) => translate(key, params, language)
    };
  }, [handleChange, language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => useContext(I18nContext);

export const useTranslation = () => {
  const { t } = useI18n();
  return { t };
};

