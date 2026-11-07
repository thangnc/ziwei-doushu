/**
 * Locale definitions — pure, browser- and server-safe (no `next/headers`, no DOM).
 *
 * Locale is chosen by a cookie (same URL for every language). See lib/i18n/README.md for the SEO limitation.
 */
export const LOCALES = ['vi', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];

/** Vietnamese is the default; Chinese is kept. */
export const DEFAULT_LOCALE: Locale = 'vi';

export const LOCALE_COOKIE = 'ziwei-locale';
/** One year. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Cookie value → locale. Anything missing or unknown falls back to the default; never throws. */
export function resolveLocale(cookieValue: string | undefined | null): Locale {
  return isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;
}

/** BCP 47 tag for `<html lang>`. */
export const HTML_LANG: Record<Locale, string> = { vi: 'vi', zh: 'zh-CN' };

/** Open Graph locale (`og:locale`). */
export const OG_LOCALE: Record<Locale, string> = { vi: 'vi_VN', zh: 'zh_CN' };

/** Cookie string for `document.cookie`. Not HttpOnly: the client switcher writes it. */
export function localeCookieString(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}
