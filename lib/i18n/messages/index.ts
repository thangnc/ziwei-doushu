import type { Locale } from '../locales';
import { vi } from './vi';
import { zh, type Messages } from './zh';

export type { Messages };

export const MESSAGES: Record<Locale, Messages> = { vi, zh };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
