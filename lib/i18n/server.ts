/**
 * Server-side locale resolution (Server Components, generateMetadata, Server Actions).
 * Reading the cookie makes the route dynamically rendered — the accepted trade-off of cookie-based locale
 * (see lib/i18n/README.md).
 */
import 'server-only';
import { cookies } from 'next/headers';
import { translate, type MessageKey, type MessageVars } from './format';
import { LOCALE_COOKIE, resolveLocale, type Locale } from './locales';
import { getMessages } from './messages';

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getT() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { locale, messages, t: (key: MessageKey, vars?: MessageVars) => translate(messages, key, vars) };
}
