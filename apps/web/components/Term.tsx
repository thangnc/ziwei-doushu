'use client';
/**
 * Shows one chart term from lib/i18n/terms.ts. A provisional term (Disputed or Unverified Hán-Việt reading, or a
 * missing entry) gets a dotted underline and a tooltip naming the Chinese identifier and its audit status
 * (docs/decisions/localization.md D-9). Settled terms, and every term in Chinese, render as plain text.
 */
import { useT } from '@/components/LocaleProvider';
import type { DisplayTerm } from '@/lib/i18n/terms';

export default function Term({ term }: { term: DisplayTerm }) {
  const t = useT();
  if (!term.provisional) return <>{term.text}</>;
  const status = term.status === 'verified' ? 'missing' : term.status;
  return (
    <span
      title={t(`terms.${status}`, { zh: term.zh })}
      style={{ textDecorationLine: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '2px' }}
    >
      {term.text}
    </span>
  );
}
