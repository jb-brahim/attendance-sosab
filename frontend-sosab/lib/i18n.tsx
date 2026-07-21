'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import ar from '@/locales/ar.json';

export type Locale = 'en' | 'fr' | 'ar';

const LOCALES: Record<Locale, typeof en> = { en, fr, ar };
const STORAGE_KEY = 'sosab_locale';

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  t: (k) => k,
  setLocale: () => {},
  isRTL: false,
});

/** Resolve dot-notation key like "nav.overview" against the translation object */
function resolve(obj: any, key: string): string {
  const parts = key.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return key;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as Locale | null;
    if (saved && LOCALES[saved]) setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    // RTL support: set dir on <html>
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  }, []);

  // Apply on mount too
  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: string): string => {
    return resolve(LOCALES[locale], key) || resolve(LOCALES['en'], key) || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, isRTL: locale === 'ar' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
