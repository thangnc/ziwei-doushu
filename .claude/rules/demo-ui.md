---
paths:
  - "apps/web/app/**"
  - "apps/web/components/**"
---

# Demo UI rules (`apps/web/`: `app/`, `components/`)

- The UI is a **minimal demo** of the engine, not the commercial site. Keep changes small and focused on showing engine output correctly. Don't port or imitate features the README lists as not open source: AI streaming, share cards, the redesigned UI.
- **No backend.** Don't add `apps/web/app/api/**` routes, server actions or API keys unless the user explicitly asks to implement one. `/api/interpret` and `/api/heming` are expected to 404. Keep the existing "开源版不含该接口" handling on a 404; don't turn it into a retry loop or a generic error.
- Charts are generated in the browser with `generateChart`. Turning birth input into a chart always goes through `formToBirthInfo` (`@ziwei/engine/share`, i.e. `packages/ziwei-engine/src/share.ts`); don't duplicate time-correction or late-子时 logic in components.
- **`server-only` modules can't be used in client components.** `packages/ziwei-engine/src/patterns.ts` and `famous.ts` import `server-only`, so `'use client'` files may only `import type` from them. `PatternsCard.tsx` and `ChartSummary.tsx` currently do a runtime import of `detectPatterns` and aren't rendered anywhere. Before using either component, compute the patterns on the server and pass them in as props.
- Engine logic belongs in the engine package (`packages/ziwei-engine/src/`, imported as `@ziwei/engine/<module>`), not in components. When a component needs a derived value (a 大限 index, a 四化 lookup), use or add a helper in `yunxian-context.ts`/`sihua.ts`.
- `localStorage` access is wrapped in `try/catch` and must fail silently (see `apps/web/lib/school-config-storage.ts`). Never assume it exists during SSR; read it in `useEffect`.
- The UI is bilingual: Vietnamese (default) and Chinese, with the language chosen by the `ziwei-locale` cookie (`apps/web/lib/i18n/`). **Put new or changed UI strings in `apps/web/lib/i18n/messages/zh.ts` and `vi.ts`**, not hard-coded. Use `useT()` in client components and `getT()` on the server.
  - Vietnamese follows `apps/web/lib/i18n/README.md`: Hán-Việt only for specialist terms marked Verified in `docs/audits/terminology-audit.md`; natural Vietnamese for ordinary UI; no Disputed terms (`docs/decisions/localization.md` D-1).
  - Pages not localized yet still have hard-coded Chinese. Localize them in their planned phase, not while working on something else.
  - Never translate engine identifiers. Chart terms are localized only for display.
- The layout must keep working on narrow screens (the chart grid stacks below `lg`, see #35). Check mobile width when changing the layout.
- When the user asks to check a UI change, run `npm run dev` and look at `/chart` (and `/heming` if you touched it) in the browser. Type-checking alone doesn't prove the UI works.
