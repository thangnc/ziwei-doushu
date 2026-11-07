'use client';
/**
 * Language switcher (Tiếng Việt / 中文).
 *
 * Phase 1 placement: a small fixed control in the bottom-right corner, rendered once by app/layout.tsx so no page
 * file has to change yet. When the page chrome is localized (later phases) it can move into the navigation.
 */
import { useLocale } from './LocaleProvider';
import { LOCALES } from '@/lib/i18n/locales';

export default function LanguageSwitcher() {
  const { locale, messages, t, setLocale, switching } = useLocale();

  return (
    <div
      role="group"
      aria-label={t('localeSwitcher.label')}
      style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 60,
        display: 'flex', gap: 2, padding: 3, borderRadius: 999,
        background: 'var(--bg-1)', border: '1px solid var(--bdr-med)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.12)', opacity: switching ? 0.6 : 1,
        fontSize: 12, lineHeight: 1,
      }}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        const name = messages.localeSwitcher[l];
        return (
          <button
            key={l}
            type="button"
            lang={l === 'zh' ? 'zh-CN' : 'vi'}
            aria-pressed={active}
            aria-label={active ? name : t('localeSwitcher.switchTo', { language: name })}
            disabled={switching}
            onClick={() => setLocale(l)}
            style={{
              padding: '6px 10px', borderRadius: 999, border: 'none',
              cursor: active ? 'default' : 'pointer',
              background: active ? 'var(--ac)' : 'transparent',
              color: active ? '#fff' : 'var(--tx-2)',
              fontWeight: active ? 600 : 400, fontFamily: 'inherit',
            }}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
