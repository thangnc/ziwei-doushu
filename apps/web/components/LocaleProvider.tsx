'use client';
/**
 * Locale context for Client Components.
 *
 * Unlike ThemeProvider (which reads localStorage on the client and can mismatch on hydration), the initial locale
 * comes from the server (cookie read in app/layout.tsx) and is passed in as a prop, so server and client render the
 * same text. Switching sets the cookie and calls router.refresh() so Server Components re-render in the new locale.
 */
import { createContext, useCallback, useContext, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { translate, type MessageKey, type MessageVars } from '@/lib/i18n/format';
import { localeCookieString, type Locale } from '@/lib/i18n/locales';
import { getMessages, type Messages } from '@/lib/i18n/messages';

interface LocaleContextValue {
  locale: Locale;
  messages: Messages;
  t: (key: MessageKey, vars?: MessageVars) => string;
  setLocale: (next: Locale) => void;
  switching: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [switching, startTransition] = useTransition();
  // The server is the source of truth: after router.refresh() the layout passes the new cookie value back in.
  const locale = initialLocale;
  const messages = getMessages(locale);

  const setLocale = useCallback((next: Locale) => {
    if (next === locale) return;
    document.cookie = localeCookieString(next);
    startTransition(() => router.refresh());
  }, [locale, router]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    messages,
    t: (key, vars) => translate(messages, key, vars),
    setLocale,
    switching,
  }), [locale, messages, setLocale, switching]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}

/** Shorthand for components that only need `t`. */
export function useT() {
  return useLocale().t;
}
