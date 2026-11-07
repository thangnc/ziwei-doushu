# i18n core (Phase 1)

Hand-written and dependency-free (repo rule: no new npm dependencies). Languages: **Vietnamese (`vi`, default)** and **Chinese (`zh`)**.

| File | Purpose |
|---|---|
| `locales.ts` | `Locale`, `DEFAULT_LOCALE = 'vi'`, the cookie name `ziwei-locale`, `resolveLocale()` (unknown values fall back to `vi`), and the `<html lang>` and `og:locale` maps. Pure; safe on both browser and server. |
| `messages/zh.ts` | **Source of truth** for keys. Its `meta.*` matches the pre-localization `app/layout.tsx` character for character. |
| `messages/vi.ts` | Must `satisfies Messages`: a missing or extra key fails `tsc`. |
| `format.ts` | `translate(messages, 'a.b', { var })` with `{var}` interpolation. A missing variable leaves the placeholder visible. Keys are type-checked. |
| `terms-data.ts` | Phase 2. Vietnamese display term and audit status for every chart identifier the engine can emit (stars, palaces, brightness, 四化, 干支, 五行局, 格局 …), taken from `docs/audits/terminology-audit.md` by the D-9 rule. |
| `terms.ts` | Phase 2. The presenter: `presentTerm(locale, category, zh)` → `{ text, zh, status, provisional }`, plus `ganzhiText`, `presentPatternName` (fixed names and the `{主星}…` templates) and `presentChart(chart, locale)`. Chinese returns the identifier unchanged. Pure; safe on both browser and server. |
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
- Disputed terms are not used in messages until a decision is made (`docs/decisions/localization.md` D-1).
- Ordinary UI text is natural Vietnamese.

## Chart terms (Phase 2)

Engine identifiers (`Star.name`, `Palace.name`, `siHua`, `brightnessRaw`, `wuxingJuName`, …) stay Chinese and are still what components compare and look up. Only the text a component **shows** goes through `terms.ts`:

```ts
const locale = useLocale();
presentTerm(locale, 'star', star.name);          // { text: 'Tử Vi', status: 'verified', provisional: false, … }
presentTerm(locale, 'star', '咸池');             // { text: 'Hàm Trì', status: 'disputed', provisional: true, … }
ganzhiText(locale, palace.stem, palace.branch);  // 'Giáp Tý' / '甲子'
```

- Display rule (`docs/decisions/localization.md` D-9): Verified rows show the conventional Vietnamese term; Disputed and Unverified rows show the Hán-Việt reading with `provisional: true`, which the UI marks with a dotted underline and a tooltip.
- Don't edit `terms-data.ts` by hand to "improve" a term. `npm test` (`i18n-terms-coverage`) checks every entry against the audit. To settle a term, record a decision and list it in `DECIDED_TERMS`.
- `vi-presentation-baseline` pins the Vietnamese board text of 96 synthetic charts. After an intended term change, run `npx tsx apps/web/test/fixtures/generate-vi-presentation-baseline.ts --write` and review the fixture diff.

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
