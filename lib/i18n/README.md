# i18n core (Phase 1)

Hand-written and dependency-free (repo rule: no new npm dependencies). Languages: **Vietnamese (`vi`, default)** and **Chinese (`zh`)**.

| File | Purpose |
|---|---|
| `locales.ts` | `Locale`, `DEFAULT_LOCALE = 'vi'`, the cookie name `ziwei-locale`, `resolveLocale()` (unknown values fall back to `vi`), and the `<html lang>` and `og:locale` maps. Pure; safe on both browser and server. |
| `messages/zh.ts` | **Source of truth** for keys. Its `meta.*` matches the pre-localization `app/layout.tsx` character for character. |
| `messages/vi.ts` | Must `satisfies Messages`: a missing or extra key fails `tsc`. |
| `format.ts` | `translate(messages, 'a.b', { var })` with `{var}` interpolation. A missing variable leaves the placeholder visible. Keys are type-checked. |
| `server.ts` | `getLocale()` / `getT()` for Server Components, `generateMetadata` and Server Actions. Reads the cookie; marked `server-only`. |
| `components/LocaleProvider.tsx` | Client context: `useLocale()`, `useT()`. The initial locale comes from the server, so it can't mismatch on hydration (unlike `ThemeProvider`). |
| `components/LanguageSwitcher.tsx` | "Tiếng Việt / 中文". Sets the cookie, then `router.refresh()`. For now it's a fixed control in the bottom-right corner, rendered by `app/layout.tsx`. |

**Using it:**
```tsx
// Server Component / generateMetadata
const { t, locale } = await getT();
// Client Component
const t = useT();  t('localeSwitcher.label');
```

**Adding a string:** add it to `messages/zh.ts`, then add the same key to `messages/vi.ts`. `npm test` (`i18n-messages-parity`) checks that both have the same keys and placeholders, that no string is empty, and that the Vietnamese contains no Chinese characters (apart from an allowlist).

**Vietnamese text must follow the language policy:**
- Specialist Tử Vi terms are in Hán-Việt and come **only** from the Verified rows of `docs/audits/terminology-audit.md`.
- Disputed terms are not used until a decision is made (`docs/decisions/localization.md` D-1).
- Ordinary UI text is natural Vietnamese.

## Fonts

- `next/font/google` loads **Be Vietnam Pro** (sans) and **Noto Serif**, both with the `vietnamese` subset. Fonts are self-hosted at build time, so `next build` needs network access to Google Fonts.
- `app/globals.css` changes `--font` and `--font-serif` only under `:root[lang="vi"]`, and keeps the CJK stacks as fallbacks. The Chinese UI's `--font` is unchanged.
- **Not done in Phase 1:** 17 inline `fontFamily` values in page and component code (STSong/STKaiti/PingFang) still override the token, and some letter-spacing is tuned for CJK. Those change when each surface is localized, in later phases.

## Known limitation: choosing the language by cookie (SEO)

The same URL serves both languages. The consequences:
- **Search engines index only the default language (Vietnamese).** Crawlers don't send our cookie, so the Chinese version isn't indexable separately.
- **There are no per-language URLs and no `hreflang` alternates.** `og:locale:alternate` is emitted, but search engines don't use it as `hreflang`.
- **A shared link opens in the recipient's own language,** not the sender's.
- **Every route that renders under the root layout is now rendered on each request** (`ƒ` in `next build`), because the root layout reads the cookie. Pages that used to be static or SSG, like `/library/*`, `/knowledge`, `/privacy` and `/terms`, lose prerendering. This doesn't affect what they output.
- `alternates.canonical` is still `/` on every page, as before. Fixing per-page canonical URLs is a separate issue (`docs/audits/ui-inventory.md` §8).

This trade-off was accepted (plan revision 3). **Upgrade path, if multilingual SEO is needed later:**
- Move routes under `app/[lang]/` with `generateStaticParams` for `vi`/`zh`.
- Add a `proxy`/middleware redirect from `/` based on the cookie or `Accept-Language`.
- Emit `alternates.languages` (`hreflang`) per page.
- Keep the cookie only as a preference.
