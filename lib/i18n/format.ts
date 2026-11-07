/**
 * Message lookup + `{var}` interpolation — pure, browser- and server-safe. No plural/gender rules:
 * neither Vietnamese nor Chinese inflects for number in this UI.
 */
import type { Messages } from './messages';

type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Dotted key of any message, e.g. 'meta.title'. Typos fail tsc. */
export type MessageKey = Paths<Messages>;
export type MessageVars = Record<string, string | number>;

export function lookup(messages: Messages, key: MessageKey): string {
  let node: unknown = messages;
  for (const part of key.split('.')) node = (node as Record<string, unknown>)[part];
  if (typeof node !== 'string') throw new Error(`i18n: no message for key "${key}"`);
  return node;
}

/** Replaces `{name}` with vars.name. Unknown placeholders are left as-is (visible, not silently dropped). */
export function interpolate(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

export function translate(messages: Messages, key: MessageKey, vars?: MessageVars): string {
  return interpolate(lookup(messages, key), vars);
}

/** Placeholder names used in a template, sorted — used by the parity test. */
export function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}
