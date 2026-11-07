# Engine protection: dependency graph, bundle report and privacy threat model

Phase 0 / D4 of the Vietnamese-localization plan. Audit only. **No product module was changed, and the target architecture isn't enforced yet.**

**Reproduce:**
```bash
npx tsx scripts/audit/dependency-graph.ts            # human-readable
npx tsx scripts/audit/dependency-graph.ts --json     # machine-readable
npx next build && npx tsx scripts/audit/dependency-graph.ts --bundle   # adds the bundle-marker states
```

> **Update 2026-11-08 (monorepo move):** build with `npm run build` (it runs `next build` in `apps/web`), then run `--bundle`. The checker now scans `apps/web/{app,components,lib}` and `packages/ziwei-engine/src`, resolves `@/` to `apps/web/` and `@ziwei/engine/<module>` to the engine sources, and searches `apps/web/.next/static`. On the new layout it reports the same 15 route entries, the same 7 unreached components and the same `patterns.ts` finding as §1. Paths and line numbers in the sections below are as of the original audit.

The checker (`scripts/audit/dependency-graph.ts`) parses every `.ts`/`.tsx` file under `app/`, `components/` and `lib/` with the TypeScript compiler API, which is already a dev dependency.

**Edge types it records:**
- `value` imports
- `type` imports: `import type`, all-`type` named imports, `import('x').T`. These are erased at compile time and **excluded** from runtime reachability.
- `reexport`
- `side-effect` imports
- literal `import()`

It resolves `@/` and relative paths the way `tsconfig.json` `paths` does.

---

## 1. Current state (2026-11-07, commit `a600484` plus uncommitted Phase 0 files)

**Scan scope:** 64 modules, of which 21 are `'use client'`. There are 15 route entries:
`app/layout.tsx`, `app/page.tsx`, `app/chart/page.tsx`, `app/heming/page.tsx`, `app/knowledge/page.tsx`, `app/knowledge/[star]/[topic]/page.tsx`, `app/library/page.tsx`, `app/library/[book]/page.tsx`, `app/library/[book]/[chapter]/page.tsx`, `app/library/search/page.tsx`, `app/preview/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/robots.ts`, `app/sitemap.ts`.

**Components no route reaches (static analysis):** `ChartSummary`, `ChatPanel`, `FamousPersonCard`, `PatternsCard`, `ShareCardCanvas`, `ShareModal`, `StarDetailPanel`. D2 (`docs/audits/ui-inventory.md`) adds whether each is reachable through interactions.

### Audited modules: the three states, reported separately

| Module | Imports `server-only` | reachable-from-client-source | reachable-from-route (static) | included-in-client-bundle |
|---|---|---|---|---|
| `lib/ziwei/patterns.ts` | **yes** (`:18`) | **YES**. A current violation: `components/ChartSummary.tsx:5` and `components/PatternsCard.tsx:4` value-import it, and both are `'use client'`. | **no**: neither component is imported by any route | see §2 |
| `lib/ziwei/famous.ts` | **yes** (`:6`) | no; the only importer is type-only (`components/FamousPersonCard.tsx:3`, `import type`, erased) | no | see §2 |
| `lib/ziwei/heming-knowledge.ts` | no | no | no; it has no importers at all | see §2 |
| `lib/ziwei/db-analysis.ts` | no | no | YES: `app/knowledge/page.tsx:8` (value import of `TOPIC_LABEL`); type-only from `app/knowledge/[star]/[topic]/page.tsx` and `lib/seo/knowledge.ts` | see §2 |

**How to read this:**
- The `server-only` violation exists in **source** only. The components carrying it aren't rendered by any route.
- If either component were wired into a page as it stands, `next build` would fail on the `server-only` import. That's the same thing the `.claude/rules/demo-ui.md` rule warns about.
- **The engine itself is client code today.** `app/chart/page.tsx` is `'use client'` and calls `generateChart()` in the browser. So `lib/ziwei/algorithm.ts` and its imports (iztro, lunar-javascript, the school tables) are reachable from client source **by design**. The target architecture (§3) changes this for detection.

## 2. Bundle results

**Build:** `next build` (Next 16.4.3, Turbopack, Node 22.22.3, local darwin/arm64) succeeded. It compiled in 1.8 s and prerendered 37 static pages, with `/library/search` the only dynamic route. 19 client chunk files under `.next/static` were searched.

The build rewrote `next-env.d.ts` from `.next/dev/types/...` to `.next/types/...` imports. I restored the file byte-for-byte afterwards, MD5 `aa94238a…`, which was its state before the build (it was already modified by an earlier `next dev`, not by this work).

**Markers:** for each audited module, its 5 longest CJK string literals, searched in client chunks:

| Module | Client chunks (`.next/static`) | Server output (`.next/server`) | State |
|---|---|---|---|
| `lib/ziwei/patterns.ts` | 0 of 5 markers found | 0 (checked for "传统古籍记载此为") | **not included-in-client-bundle**; not in server output either, since no route uses it |
| `lib/ziwei/famous.ts` | 0 of 5 found | not checked | not included-in-client-bundle |
| `lib/ziwei/heming-knowledge.ts` | 0 of 5 found | not checked | not included-in-client-bundle |
| `lib/ziwei/db-analysis.ts` | no CJK literal of 8+ characters, so no markers | — | undetermined by markers; statically reachable from `/knowledge` (server component) |

**Positive control:** strings from modules known to be client code **are** found, so the method can detect inclusion.

| String | Client chunks | Server output |
|---|---|---|
| "开源版不含 AI 解读接口" (`InsightPanel`) | 1 | 2 |
| "命格解读生成中" (`InsightPanel`) | 1 | 2 |
| "排盘内核完全开放" (`app/chart/page.tsx`) | 1 | 3 |

**Summary of the three states for `patterns.ts` today:** reachable-from-client-source **YES** (unused components) · included-in-client-bundle **no** · reachable-from-route **no**.

## 3. Target architecture (Phase 4; not implemented, not enforced)

**Detection stays on the server:**
- **`lib/ziwei/patterns/pattern-types.ts`:** serializable `PatternMatch { id, level, palaces, vars, required/bonus/breaking: {key, vars}[], sourceId }`.
- **`lib/ziwei/patterns.ts`:** keeps `import 'server-only'`.
  - `detectPatternMatches(chart)` returns `PatternMatch[]`.
  - `detectPatterns()` keeps its exact current output, built from the matches plus the zh presenter. The `patterns-baseline` fixture must still match.
- **Rule modules:** any detection or rule module split out of `patterns.ts` also gets `import 'server-only'`.
- **`lib/ziwei/patterns/pattern-presenter.ts` + `pattern-locales/{zh,vi}.ts`:** turn matches into display content.
- **Data flow:**
  1. A server component (or server action) runs detection, then presentation.
  2. It passes the finished, serializable display data to a client `PatternsCard` as props.
  3. No client module imports `patterns.ts` or any rule module.
- **Enforcement:** `dependency-graph.ts` becomes a regression test that fails when any `server-only` module is **reachable-from-client-source**. The bundle-marker search stays a second check only.
  - **Update 2026-11-08:** a narrower check now runs in CI. `scripts/regression/engine-import-boundary.test.ts` fails if `lib/ziwei` imports anything outside itself except `iztro`, `lunar-javascript` and `server-only`, or references `window`, `document`, `localStorage`, `sessionStorage` or `navigator`. The `server-only` reachability test above is still to do, because the unused `ChartSummary` / `PatternsCard` still violate it (D-4).

### Canonical `/chart` request flow (target)

1. **Normal chart generation** is a **POST / server action**, with the birth data in the request **body**. The server action:
   1. validates the input
   2. resolves the timezone (`docs/architecture/time-model.md`)
   3. runs `generateChart`
   4. runs detection and presentation
   5. returns serializable data to the existing client components

   The `/chart` URL never contains birth data.
2. **Share URL:** created **only** when the user explicitly presses "Share", after a clear notice that the link contains birth information. Opening a share URL renders on the server from its parameters; that is the only GET path carrying birth data.
3. `lib/ziwei/share.ts:formToSearchParams` is used only by that explicit share action.
4. `/heming` follows the same pattern.

This needs no `/api` route and no API key. The repo rule "no backend" (`.claude/rules/demo-ui.md`) and the README's "排盘…都在浏览器里" are updated in Phase 1 to describe this.

## 4. Privacy threat model (documented only; implementation is Phase 3/4)

**Today:** charts are generated in the browser, so birth data doesn't reach this app's server. `formToSearchParams`, `searchParamsToForm` and `useHistory` exist in `lib/` but **no route calls them** (`grep` of `app/` and `components/`, 2026-11-07). (**Superseded 2026-11-07:** `useHistory` and its file `lib/ziwei/history.ts` were deleted.) The target architecture **introduces** server-side processing, so the risks below are new.

| Exposure | GET `/chart?y=…&h=…&lng=…` | POST / server action (recommended) |
|---|---|---|
| Browser history, autocomplete, bookmarks, synced history | Birth data persists in the URL | Not in the URL |
| Hosting / reverse-proxy access logs, platform request logs | Request lines with query strings are commonly logged | Bodies are commonly not logged by default. **To be confirmed** for the actual host; there's no deployment config in this repo (`.vercel/` is gitignored). |
| Analytics and speed insights (`app/layout.tsx:4–5, 49–50` mounts `@vercel/analytics` and `@vercel/speed-insights`) | Page-view events capture the URL unless stripped | No data in the URL, but the payload must not be added to events |
| Error monitoring | URLs and request context end up in error reports | Payloads must be excluded from error context |
| `Referer` header | Leaks the full URL. Under `strict-origin-when-cross-origin` (the browser default) the **full URL including query** is still sent on **same-origin** requests, so it reaches our own logs and analytics; only the origin is sent cross-origin. Only `no-referrer` sends nothing. | Nothing sensitive in the URL |
| CDN / shared caches | A URL-keyed cache could serve one person's chart to another; responses must be `private, no-store` and dynamic | POST responses aren't cached by default; still mark them `no-store` |
| Accidental sharing | Every chart URL is a shareable copy of birth data | Only an explicit "Share" creates such a URL |

**What `Cache-Control: private, no-store` does and doesn't do:**
- It stops shared caches and browser storage of the **response**.
- It does **not** stop the request URL appearing in history, logs, analytics or `Referer`.
- Hence POST is preferred, and `no-referrer` is required wherever a URL can carry birth data.

**Recommendation** (your stated preference, for approval):
1. Use a **POST / server action** for normal generation; the birth data is never in a URL.
2. Create **share URLs only on an explicit "Share" action**, with a notice that the link contains birth date, time and place.
3. Send **`Referrer-Policy: no-referrer`** on `/chart`, `/heming` and every share URL, both as a response header (`next.config.js` `headers()`) and as `<meta name="referrer" content="no-referrer">`.
   - **Verification once implemented:** from a share URL, load a same-origin resource and follow a cross-origin link; check in the browser network panel and the server log that neither request carries a `Referer`.
4. **Never log or report** birth date, time, place, coordinates, name, gender or calculation parameters:
   - an analytics `beforeSend` strips query strings and sensitive paths
   - speed insights are excluded on chart routes or sanitised the same way
   - error reporting removes request bodies and query strings
5. Mark chart responses `Cache-Control: private, no-store` and render them dynamically.
6. Update the privacy page (Phase 6) to describe the processing on the server.

**References:**
- Referrer Policy, W3C: https://www.w3.org/TR/referrer-policy/ (§ "strict-origin-when-cross-origin": full URL for same-origin requests, origin only cross-origin).
- MDN `Referrer-Policy`: https://developer.mozilla.org/docs/Web/HTTP/Headers/Referrer-Policy
- Next.js server actions and mutations: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- These are standard references and weren't re-fetched for this audit. The behaviour is to be verified empirically per item 3 when implemented.

## 5. Limitations of this analysis

**Static graph:**
- Non-literal `import()`, `require` built at runtime, and `next/dynamic` loaders are invisible or only approximated. Non-literal dynamic imports are reported as `unresolved`; the current scan found none.
- Re-exports (`export * from`, barrel files) are followed as `reexport` edges at module level. The checker doesn't track which **symbols** pass through, so a type-only symbol in a value re-export counts as a runtime edge. This is conservative.
- Only `@/` and relative paths are resolved. Bare packages (iztro, react…) aren't graphed.
- The `'use client'` directive is detected only at the top of the file. In Next, a module becomes client code when it's **imported from** a client module. The BFS from client modules models this, but server components passed as props or children across the boundary aren't modelled.
- Conditional imports, JSON and asset imports, and CSS aren't analysed.

**Bundle markers:**
- Tree-shaking may drop an imported module, so a source import doesn't prove inclusion.
- Minification renames identifiers, so only string literals (here, long CJK literals) are used as markers.
- Lazy chunks may load only on interaction. All `.next/static/**/*.js` chunks are searched regardless.
- Server-component code never appears in `.next/static`, so "absent" only says something about client chunks.
- A marker that isn't found doesn't prove a module is absent: its strings may be transformed or deduplicated. The graph stays the primary check.

**Runtime reachability:** this report gives only the **static route-reachability** half. Interaction-only reachability (modals, state changes, error paths) is in D2 (`docs/audits/ui-inventory.md`).
