# UI inventory (Phase 0 · D2)

> Audit only. No product file was changed to produce this document. Every item below marked **Proposal** is for the user to approve; nothing is in or out of scope until the table in §5 is approved.

## 1. Purpose, method, environment

**Purpose.** List every route, layout, modal, panel and interaction in the demo UI, so the Vietnamese localization can be scoped against what users actually see. Each entry records four separate states:

| State | Question it answers |
|---|---|
| **Code exists** | Is the file present (path)? |
| **Route reachability** | Is it rendered on load by some route, traced from `app/**` through value imports, `<Link>`/`<a href>` and `router.push` targets? (`import type` is erased and does not count.) |
| **Interaction reachability** | Does it appear only after a state change: modal trigger, form submit, palace click, view switch (本命/大限/流年), year change, error path, or the 404 API path? |
| **Runtime data sources** | What feeds its text: engine output (`generateChart`), constants, localStorage, URL params, API responses, `lib/classics`, `lib/seo/knowledge.ts`, `lib/ziwei/db-analysis.ts`. |

**Date:** 2026-11-07. **Commit:** `a600484` (working tree had unrelated uncommitted edits from other Phase 0 deliverables; none touched `app/` or `components/`).

**Environment:** macOS (Darwin 25.5.0), Node v26.0.0, Next.js 16.4.3 (Turbopack dev server, `npx next dev -p 3123`), React 19.3.0, iztro 2.6.1, Google Chrome 157.0.8103.38 (headless).

**Method.**
1. **Static trace.** Every `import`/`export … from`/`import()`/`next/dynamic`/`require` in `app/`, `components/`, `lib/` was listed with grep, and each was classified as value import or `import type`. There is no `next/dynamic`, `React.lazy` or `require` anywhere in `app/`, `components/` or `lib/`. The only dynamic `import()` is `import('html2canvas')` in `components/ShareCardCanvas.tsx:277`. Every `href=`, `<Link>`, `router.push` and `fetch(` target was listed the same way.
2. **Interactive walkthrough.** This was meant to run in the Chrome extension, but it was **unavailable**: `tabs_context_mcp` failed 3 times ("Browser extension is not connected") and `list_connected_browsers` returned `[]`. As a fallback I drove the **locally installed Chrome in headless mode** through the DevTools Protocol, using a throwaway script and a throwaway profile under the session scratchpad. The script made real interactions: clicks, `<select>`/`<input>` changes dispatched as React-compatible `change`/`input` events, Enter keydowns, and viewport changes. It recorded DOM text, `localStorage`, network status codes and console errors after each step, and took screenshots. **Limits:** nobody looked at the pages live. Hover states, animation smoothness, touch gestures and the visual layout were judged only from screenshots at 1280×900 and 390×844, and focus/keyboard navigation was not tested. Robots, sitemap, titles and canonicals were also fetched as server HTML with `curl`. All birth data was synthetic: 1990-05-10 10:30 female 北京市/北京, 1992-08-20 14:15 male 上海市, and the invalid date 1990-02-30.
3. **String counts.** These come from an AST pass using the repo's own `typescript` 5.9.3, so comments are never visited. The method is in §1.1.

### 1.1 String-count method (reproducible)

- **Unit:** one string = one `JsxText` node, `StringLiteral`, `NoSubstitutionTemplateLiteral`, or template head/middle/tail that contains at least one CJK ideograph (`[㐀-鿿豈-﫿]`). Module specifiers and `'use client'` are skipped. A JSX text node broken by an `{expr}` counts as two strings. "CJK chars" is the number of ideographs.
- **Structural roles**, decided from the AST first:
  - **(key):** a CJK string used as an identifier, never shown as-is. These are object-literal keys, `===`/`!==` operands, element-access indexes and `case` labels, e.g. `PALACE_ROLES['兄弟宫']` or `SIHUA_COLORS['禄']`.
  - **(prompt):** part of a literal or template containing `按以下结构输出`. These are AI prompts POSTed to `/api/interpret` and never displayed, because the user bubble is `hidden`.
- **Category for the rest**, first match wins:
  1. **quote:** text attributed to 倪师/倪海厦 or a classical source. Regex: `/(古诀|南北山人|倪师(曾)?(说|认为|视|强调|反复强调|在|将|反对|始终|的)|倪海厦.*「|「[^」]{4,}」.*倪|他在《天纪》课程中明言|— 倪海厦|^「命运不是)/`
  2. **message:** errors, validation, empty, loading and 404 notices. Regex: `/(失败|错误|请先|请选择|请输入|没有|不可用|开源版不含|生成中|起盘中|分析中|对比双方|加载|暂未|年份范围|无响应|请求失败|重试|已复制|未知宫位|（空）|先选省份|（请选择城市）|找到|命盘已生成|仅供研究参考|估算值)/`
  3. **term:** at most 8 ideographs, made only of chart vocabulary: star, palace, 四化, stem/branch, 大限/流年/本命, brightness and 五行 words, plus `·`, digits and dashes.
  4. **prose:** 20 or more ideographs.
  5. **UI chrome:** everything else.
- **Accuracy:** these are **estimates**. I read the per-string dump for the `/chart` and `/heming` files (93 *UI*/*message* rows) and every *quote* row. About 5 of the 93 rows are arguable or misfiled:
  - `请输入姓名`, `先选省份` and `（请选择城市）` are placeholders but land in *message*.
  - The `月`/`日` fragments of `${m}月没有${d}日` split across *message* and *UI*.
  - `请求失败` and `无响应流` (`InsightPanel.tsx:285-286`) are internal `Error` messages that are caught and never shown, yet count as *message*.

  Every *quote* row was genuinely attributed text.
- **Reproduce:** run `node count-strings.cjs <repo> <files…>` for the table, or add `--dump` for one row per string. The script is the AST walk above plus the regexes listed here. It was a throwaway scratchpad script and is deliberately not committed (Phase 0 adds only this file for D2); the rules above are enough to rebuild it.

---

## 2. Route table

"Rendering" means what Next.js reports for the route type. "Client" means the page file starts with `'use client'`, so it cannot export `metadata` and inherits the root title.

| Route | File | Server/Client | Rendering | `<title>` (observed) | Inbound links (static trace) | Notes |
|---|---|---|---|---|---|---|
| *(root layout)* | `app/layout.tsx` | server | wraps every route | `紫微命盘 · 倪海厦正宗紫微斗数` | — | `<html lang="zh-CN">` (`:41`). Inline theme script reads `ziwei-theme` (`:43`). Wraps `ThemeProvider` and mounts `Analytics`/`SpeedInsights`. Metadata `:8-37`: OG `locale: 'zh_CN'`, `siteName: '紫微研究'`, keywords, **`alternates.canonical: '/'`, which every page inherits** (§8). |
| `/` | `app/page.tsx` | client | static shell | root title | `/heming` 返回 (`router.push('/')`); `/preview` buttons; `← 首页`/`返回首页` links on library, knowledge, privacy, terms | Mounts `AnnouncementModal` and `StarField` (`:468-470`). |
| `/chart` | `app/chart/page.tsx` | client | static shell; chart computed in browser | root title | home (`router.push('/chart')` at `:502,:563,:1098`, `<a href="/chart">` at `:1148`); `/library` 起盘 →; knowledge detail; `/preview` | Form until submit, then board. |
| `/heming` | `app/heming/page.tsx` | client | static shell | root title | home (`:495,:1069`); `/preview` | Two `BirthForm`s plus an analysis box. |
| `/library` | `app/library/page.tsx` | server | static | `倪师方法论 · 古籍原典库 · 紫微斗数全集 / 全书 / 骨髓赋` | home `:1117`; knowledge index; search, book and chapter headers | Hosts client `LibrarySearch`. |
| `/library/[book]` | `app/library/[book]/page.tsx` | server | SSG, `generateStaticParams` → 3 books | e.g. `《骨髓赋》· 明代 · 紫微斗数古籍原典库` | `/library` cards; chapter header | Unknown slug → `notFound()` (observed 404). |
| `/library/[book]/[chapter]` | `app/library/[book]/[chapter]/page.tsx` | server | SSG → 21 chapters | e.g. `总论篇 · 《骨髓赋》· 紫微斗数古籍` | book TOC; prev/next; search hits (`#paragraphId`) | Unknown index → 404 (observed). |
| `/library/search?q=` | `app/library/search/page.tsx` | server | dynamic (reads `searchParams`) | `搜索 · 古籍原典库` | `LibrarySearch` → `router.push('/library/search?q=…')` | Three states: hits, no hits, no `q`. |
| `/knowledge` | `app/knowledge/page.tsx` | server | static | `紫微斗数知识库 · 14 主星 × 13 宫位 · 倪海厦正宗体系` | home `:1105`; knowledge detail breadcrumb | 14 star cards link to `/knowledge/<slug>/overview`, **all of which 404** (§8). |
| `/knowledge/[star]/[topic]` | `app/knowledge/[star]/[topic]/page.tsx` | server | SSG with `dynamicParams = false` (`:31`); `generateStaticParams` returns **0** routes because `STAR_DB = {}` | none (always 404) | `/knowledge` cards and topic chips (chips render 0) | **Code exists, route unreachable at runtime.** 42 strings, all dormant. |
| `/privacy` | `app/privacy/page.tsx` | server | static | `隐私政策 · 紫微命盘` | home footer `:1185`; `/terms` | Text describes commercial-site processing (§8). |
| `/terms` | `app/terms/page.tsx` | server | static | `服务条款 · 紫微命盘` | home footer `:1183`; `/privacy` | Same as `/privacy`. |
| `/preview` | `app/preview/page.tsx` | client | static shell | root title | **none**; not in sitemap, not disallowed in robots (robots disallows `/preview-versions/`) | Orphan route, reachable only by typing the URL. Runs `ScrollIntro`, then shows a developer panel ("如果满意，告诉我，我把它接到主页"). |
| `/robots.txt` | `app/robots.ts` | server | metadata route | — | — | Disallow `/api/`, `/preview-versions/`. Host = `SITE_URL` (default `http://localhost:3000`, `lib/site.ts:5`). |
| `/sitemap.xml` | `app/sitemap.ts` | server | metadata route | — | — | **31 URLs** observed: 7 static + 3 books + 21 chapters + **0 knowledge**. |
| *(any unknown path)* | none (no `app/not-found.tsx`) | server | Next default | root title (observed) | — | Next's built-in **English** "404 / This page could not be found." is shown under `lang="zh-CN"`. Needs a localized `not-found.tsx`. |
| `POST /api/interpret` | absent | — | **404 by design** | — | `InsightPanel.tsx:279`, `ChatPanel.tsx:44` | Observed 404 on every call. |
| `POST /api/heming` | absent | — | **404 by design** | — | `app/heming/page.tsx:111` | Observed 404. |

---

## 3. Component table

Count columns: **UI / Term / Prose / Quote / Msg** are displayable strings (§1.1). **(key)** and **(prompt)** are not displayed. "On load" means rendered on first paint of some route; "Interaction" means it appears only after an action.

### 3.1 Reachable components

| Component (file) | S/C | Route reachability | Interaction reachability | Runtime data sources | UI | Term | Prose | Quote | Msg | (key) | (prompt) |
|---|---|---|---|---|--:|--:|--:|--:|--:|--:|--:|
| Root layout `app/layout.tsx` | S | every route | — | constants (metadata), `localStorage['ziwei-theme']` (inline script), env `NEXT_PUBLIC_*` | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| `ThemeProvider` `components/ThemeProvider.tsx` | C | every route (via layout) | toggle via `useTheme().toggle` | `localStorage['ziwei-theme']`, `<html data-theme>` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Home page `app/page.tsx` (with inline `ThemeToggle`, `FadeIn`, `FeatureVisual`, `WeakBoundary`) | C | `/` | `FeatureVisual` index 1: clicking a star or 四化 chip shows a brief card (`STAR_BRIEF`/`SIHUA_BRIEF`). `ThemeToggle` label flips 暗色/亮色. | constants in file (`STARS`, `FEATURES`, `SECTIONS`, `NI_TEACHINGS`, `STAR_BRIEF`, `SIHUA_BRIEF`), theme | 127 | 46 | 47 | 12 | 0 | 18 | 0 |
| `AnnouncementModal` `components/AnnouncementModal.tsx` | C | `/`, mounted on load and rendered only after `useEffect` | **opens only if `localStorage['announcement_seen_2026-05-01']` is missing**. Closes via "我知道了" or the × button, which writes the key. Backdrop click does not close. Locks `body` scroll while open. | constants, localStorage | 10 | 0 | 5 | 1 | 0 | 0 | 0 |
| `StarField` `components/StarField.tsx` | C | `/` | — | theme (canvas colours) | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Chart page `app/chart/page.tsx` | C | `/chart` | form state → board state after submit. `← 重新起盘` returns to an empty form. | engine (`generateChart`) | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| `BirthForm` `components/BirthForm.tsx` | C | `/chart` (on load); `/heming` ×2 with `hideSubmit` | Field errors appear only after touch or submit. Summary chip appears when the date is valid. Location line switches between hint and info when a province is picked. Spinner label `紫微起盘中…` needs the `loading` prop, which no caller passes (dormant). | constants `SHICHEN` (`constants.ts:8`), `PROVINCES` (`cities.ts`, 34 provinces / 484 cities, Chinese only), `calcTrueSolarBranch`/`formToBirthInfo` (`share.ts`) | 28 | 16 | 1 | 0 | 9 | 0 | 0 |
| `TimeNav` `components/TimeNav.tsx` | C | `/chart` after submit, **rendered twice** (page `:55` and inside `ChartBoard` `:93`) | 本命/大限/流年 tabs; ‹ › year buttons; `年四化：` line only when the view is not 本命 | engine (`daXians`, `currentDaXianIndex`, palace stems), constants (`STEMS`, `SI_HUA_TABLE`), current year from `new Date()` | 2 | 13 | 0 | 0 | 0 | 4 | 0 |
| `ChartBoard` `components/ChartBoard.tsx` | C | `/chart` after submit | palace click → 三方四正 SVG overlay. Its own `TimeNav` → dashed overlay badges `限禄…`/`年科…`. Props `onStarSelect` and `onSiHuaClick` exist but **are not passed** by the page. | engine (`palaces`, `mingGongBranch`, `shenGongBranch`, `wuxingJuName`, `daXians`, `lunarInfo`), constants | 4 | 10 | 0 | 0 | 0 | 0 | 0 |
| `PalaceCell` `components/PalaceCell.tsx` | C | `/chart` after submit (12×) | selected/三方 highlight; overlay badges after a view switch | engine (palace `name` from iztro, stars, `siHua`, `daXianAge`, `brightness` shown **as colour only**) | 0 | 3 | 0 | 0 | 0 | 4 | 0 |
| `InsightPanel` `components/InsightPanel.tsx` | C | `/chart` after submit; auto-POSTs the overview prompt on mount | Every palace click, topic button or 追问 POSTs `/api/interpret`, which returns **404**. Each call appends `开源版不含 AI 解读接口…`. A non-404 failure shows `解读失败，请稍后重试。`. `selectedSiHua` prop is never passed (dormant). | API response (none: 404), engine (palace name/stars into prompts), constants (`TOPICS`, `TOPIC_PROMPTS`, `PALACE_ROLES`) | 23 | 2 | 0 | 0 | 6 | 12 | 25 |
| Heming page `app/heming/page.tsx` (with inline `AiContent`) | C | `/heming` | `请先填写双方完整出生信息` after an incomplete start. Spinner `正在对比双方命盘…`. 404 → `开源版不含合盘 AI 分析接口…`; other failures → `分析暂时不可用，请重试。`. **Suggested questions and the follow-up box need a non-empty `analysis`, which is unreachable in this repo.** | engine (`generateChart` ×2, results stored but **never rendered**), API (404), BirthForm state | 18 | 0 | 1 | 0 | 5 | 0 | 0 |
| Library index `app/library/page.tsx` | S | `/library` | — | `lib/classics` (`ALL_BOOKS`, `TOTAL_PARAGRAPHS` = 75), book metadata (`title`, `dynasty`, `author`, `intro`) | 13 | 0 | 3 | 0 | 1 | 0 | 0 |
| `LibrarySearch` `app/library/LibrarySearch.tsx` | C | `/library` | Enter or 搜索 → `router.push('/library/search?q=')`; button disabled while empty | user input | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| Book TOC `app/library/[book]/page.tsx` | S | `/library/[book]` | — | `lib/classics` (chapter `title`/`subtitle`) | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| Chapter reader `app/library/[book]/[chapter]/page.tsx` | S | `/library/[book]/[n]` | prev/next links; `#paragraphId` anchor from search | `lib/classics` (`p.text`; `p.translation`/`p.niNote` blocks `白话`/`倪师注` exist, but **0 paragraphs have that data**, so they are dormant) | 8 | 0 | 0 | 0 | 0 | 0 | 0 |
| Search results `app/library/search/page.tsx` | S | `/library/search` | 3 states: hits (`共找到 N 条…`), no hits (`暂未在已收录古籍中找到这个关键词`), no `q` (`请输入要搜索的关键词`, heading `「（空）」`) | URL param `q`, `searchClassics` snippets (HTML-escaped `<mark>`) | 8 | 0 | 0 | 0 | 4 | 0 | 0 |
| Knowledge index `app/knowledge/page.tsx` | S | `/knowledge` | — | `lib/seo/knowledge.ts` (`ALL_STARS`, `STAR_BRIEF_SEO`, `STAR_TO_SLUG`), `db-analysis.ts` (`TOPIC_LABEL`); topic chips filtered by `getKnowledge().exists` → **0 chips** | 17 | 1 | 1 | 0 | 0 | 0 | 0 |
| Knowledge detail `app/knowledge/[star]/[topic]/page.tsx` | S | **unreachable** (always 404) | — | `lib/seo/knowledge.ts` + `STAR_DB` (empty) | 36 | 4 | 2 | 0 | 0 | 0 | 0 |
| Privacy `app/privacy/page.tsx` | S | `/privacy` | — | constants | 34 | 0 | 13 | 0 | 0 | 0 | 0 |
| Terms `app/terms/page.tsx` | S | `/terms` | — | constants | 20 | 0 | 17 | 0 | 1 | 0 | 0 |
| Preview `app/preview/page.tsx` | C | `/preview` (orphan) | panel appears after `ScrollIntro.onComplete` (~4.2 s); `再 播 放 一 次` replays | constants | 13 | 0 | 1 | 0 | 0 | 0 | 0 |
| `ScrollIntro` `components/ScrollIntro.tsx` | C | `/preview` on load | `跳 过 →` button | constants (北斗 names, seal text `王多鱼印`) | 14 | 1 | 0 | 0 | 0 | 0 | 0 |

**Per-route totals.** Each file is counted once per route; `BirthForm` counts on both `/chart` and `/heming`. "Displayable" = UI + Term + Prose + Quote + Msg.

| Route | UI | Term | Prose | Quote | Msg | (key) | (prompt) | Displayable |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| layout (all routes) | 3 | 0 | 3 | 0 | 0 | 0 | 0 | 6 |
| `/` (+ AnnouncementModal) | 137 | 46 | 52 | 13 | 0 | 18 | 0 | 248 |
| `/chart` | 59 | 44 | 3 | 0 | 15 | 20 | 25 | 121 |
| `/heming` | 46 | 16 | 2 | 0 | 14 | 0 | 0 | 78 |
| `/library*` (4 pages + search box) | 36 | 0 | 3 | 0 | 5 | 0 | 0 | 44 |
| `/knowledge*` (index + dormant detail) | 53 | 5 | 3 | 0 | 0 | 0 | 0 | 61 (of which 42 dormant) |
| `/privacy` + `/terms` | 54 | 0 | 30 | 0 | 1 | 0 | 0 | 85 |
| `/preview` (+ ScrollIntro) | 27 | 1 | 1 | 0 | 0 | 0 | 0 | 29 |
| **Reachable files, deduplicated** | **387** | **96** | **96** | **13** | **26** | **38** | **25** | **618** |
| Unwired 7 (§5) | 81 | 64 | 57 | 42 | 9 | 42 | 0 | 253 |
| **All 32 files** | **468** | **160** | **153** | **55** | **35** | **80** | **25** | **871** (976 incl. key/prompt; 12,425 CJK chars) |

These counts cover **only strings written in `app/` and `components/`**. Most of what the user reads on `/chart` comes from `lib/`; see §7.

---

## 4. Interaction-only surfaces

| # | Surface | Trigger | Where | Strings shown | Verified in walkthrough |
|---|---|---|---|---|---|
| I1 | AnnouncementModal | first visit to `/` (localStorage key absent) | `AnnouncementModal.tsx:15-22` | title, banner (`5 月 1 日 — 5 月 8 日`, a dated promo), 7 prose paragraphs, `我知道了` | yes (opens, locks scroll, dismiss writes key, no reopen) |
| I2 | Theme toggle | click `ThemeToggle` (aria-label `切换亮色主题`/`切换暗色主题`) | `app/page.tsx:39-79` | `暗色`/`亮色`, aria-labels | yes (`data-theme` and `ziwei-theme` flip) |
| I3 | Feature chips | click a star or 四化 chip in feature card 2 | `app/page.tsx:308-375` | `STAR_BRIEF[*]` / `SIHUA_BRIEF[*]` (attribute + brief) | yes (`紫微` → `土·帝王星`). The chips share one `sel` state, so only one card shows at a time. |
| I4 | Field validation | touch a date select then clear it; or submit with an impossible date | `BirthForm.tsx:91-99, 177-193` | `请选择出生年份`, `请选择月份`, `请选择日期`, `${m}月没有${d}日` | yes. The **empty submit is blocked by native `required`**, so the custom errors don't show and the browser's own tooltip (browser language) does. `年份范围：1900–2026` is **unreachable** (the select only offers 1900–2026). |
| I5 | Summary chip | valid date (and time or 时辰不详) | `BirthForm.tsx:112-121, 425-449` | `1990年5月10日 · 北京 · 巳时 · 女` (hand-built date) | yes |
| I6 | Location info line | pick a province | `BirthForm.tsx:316-336` | `北京 · 经度 116.4°E · 时差 -14 分钟` | yes |
| I7 | Unknown time | tick checkbox | `BirthForm.tsx:377-387` | `时辰不详` in the summary; charted as 子时 | yes |
| I8 | Chart board | submit a valid form on `/chart` | `app/chart/page.tsx:42-73` | everything in §3 for TimeNav/ChartBoard/PalaceCell/InsightPanel | yes |
| I9 | 三方四正 overlay | click a palace | `ChartBoard.tsx:77-88, 188-261` | none (SVG); toggles off on a second click | yes |
| I10 | InsightPanel 404 notice | mount, palace click, topic click, 追问 | `InsightPanel.tsx:208-275, 313-316` | `命理解读` header + `开源版不含 AI 解读接口（/api/interpret）…` per call | yes (1 on mount, +1 per palace click, +1 per topic, +1 per 追问, each `POST /api/interpret → 404`) |
| I11 | View switch, **page-level** TimeNav | click 大限/流年 in the **first** tab bar | `app/chart/page.tsx:55-61` | `大限·乙年四化：…` line under that bar only | yes. **The board does not change**, because page state isn't passed to `ChartBoard` (§8). |
| I12 | View switch, **board** TimeNav | click 大限/流年 in the **second** tab bar | `ChartBoard.tsx:93-99, 63-75` | `…年四化：`, dashed badges `限禄/限权/限科/限忌` or `年…` | yes |
| I13 | Year change | ‹ / › on either TimeNav | `TimeNav.tsx:120-140` | year number, `YYYY·X年四化：` | yes (2026 → 2027) |
| I14 | Overlay badge click | click a dashed `年…`/`限…` badge | `PalaceCell.tsx:151-154` → `ChartBoard` `onSiHuaClick` | **nothing** (handler not wired) | yes (no request, no UI) |
| I15 | Star click | click a major star name | `PalaceCell.tsx:137` → `ChartBoard` `onStarSelect` | **nothing** (handler not wired; StarDetailPanel unwired) | yes |
| I16 | 重新起盘 | click `← 重新起盘` | `app/chart/page.tsx:44-53` | form returns **empty**; nothing saved to history | yes |
| I17 | Heming form error | click `开始合盘分析` with either form incomplete | `heming/page.tsx:87-92` | `请先填写双方完整出生信息` | yes |
| I18 | Heming 404 | both forms complete → start | `heming/page.tsx:111-117, 285-291` | `正在对比双方命盘…` (briefly), then `开源版不含合盘 AI 分析接口（/api/heming）…` | yes (`POST /api/heming → 404`) |
| I19 | Heming invalid date | one form 1990-02-30 → start | `heming/page.tsx:74-80, 103-107` | `分析暂时不可用，请重试。` (generic; engine `RangeError` swallowed). Field error `✕ 2月没有30日` appears only after the select is touched. | yes on a fresh page. **After a 404 has happened, the same path shows the 404 text instead**, because `apiMissing` is never reset (§8). |
| I20 | Heming suggested questions / follow-up | needs non-empty `analysis` | `heming/page.tsx:295-359` | 5 preset questions, `针对此次合盘继续追问`, placeholder, `继续追问`/`分析中…` | **not reachable** (needs a working `/api/heming`) |
| I21 | Library search | type + Enter or 搜索 | `LibrarySearch.tsx:17-23` | navigates to `/library/search?q=` | yes (`紫微` → 22 hits) |
| I22 | Search: no results / empty | `?q=<no match>` / no `q` | `search/page.tsx:45-66` | `暂未在已收录古籍中找到这个关键词`, `我们持续补充内容中…`, `请输入要搜索的关键词`, `「（空）」` | yes |
| I23 | Library 404 | unknown book or chapter | `notFound()` | Next default English 404 | yes |
| I24 | Knowledge detail 404 | any star card on `/knowledge` | `dynamicParams=false` + 0 params | Next default English 404 | yes (`GET /knowledge/ziwei/overview → 404`) |
| I25 | ScrollIntro → preview panel | wait ~4.2 s or click `跳 过 →` | `ScrollIntro.tsx:13-…`, `preview/page.tsx:19` | dev panel text, timeline list | yes |
| I26 | Narrow screen | viewport < `lg` (1024px) | `chart/page.tsx:64` (`grid-cols-1 lg:…`), `heming` `@media (max-width:680px)` | — | yes at 390px: no horizontal scroll on `/`, `/chart`, `/heming`. Palace cells are 88.75px wide, and a two-character star name followed by two 四化 badges **wraps one character per line** (`天/同`, `太/阴` in the 390px screenshot). |

---

## 5. Unwired-components audit (Proposals for approval)

**Importer check.** `grep` over `app/`, `components/`, `lib/` and `scripts/` found **no importer, static or dynamic**, of any of the seven files, apart from `ShareModal` importing `ShareCardCanvas`. There is no `next/dynamic` or `React.lazy` anywhere, and no test imports them. So all seven are **code exists = yes, route reachability = no, interaction reachability = no, runtime data = none today**. All seven are `'use client'`.

| Component | Lines | Imports (value vs type) | `server-only` exposure | Strings UI/Term/Prose/Quote/Msg (key) | What it would show / need | **Proposal** | Reason |
|---|--:|---|---|---|---|---|---|
| `PatternsCard.tsx` | 93 | `motion` (value); `ZiweiChart` (type); **`detectPatterns` from `@/lib/ziwei/patterns` (value, `:4`)** | **Yes.** `patterns.ts:18` is `import 'server-only'`, and this is a runtime import inside a client file, so rendering it anywhere in the client tree breaks the build/runtime. | 6/1/0/0/0 (0) | 格局 list with 必须/加分/破格 conditions and `出处` per pattern; pattern names and conditions come from `patterns.ts` | **Localize & wire in** (Phase 4, as D4 describes: server computes, passes props) | "格局 on /chart" is agreed scope. It is the smallest pattern component and the target of the D4 design. The text volume sits in `patterns.ts` (641 strings, §7), not here. |
| `ChartSummary.tsx` | 265 | `motion` (value); `ZiweiChart` (type); `BRANCHES, STEMS` (value); **`detectPatterns, getMingGongSummary` from `patterns` (value, `:5`)** | **Yes**, same as PatternsCard. | 15/17/0/0/0 (5) | 命格总览 (命宫主星, 性格特质, 五行局 · 当前大限), 公历/农历 line built by hand, 本命四化 per palace, a 格局识别 block that **duplicates PatternsCard**, 大限运程 strip | **Localize but keep unwired** | Its 格局 block duplicates PatternsCard, and the rest overlaps what ChartBoard already shows (命宫/身宫/五行局/current 大限). Wiring it would need the same server split and more presenter work for little gain. The alternative, if the user wants a summary card, is to fold its 本命四化/大限运程 sections into the PatternsCard work. |
| `StarDetailPanel.tsx` | 332 | `motion` (value); `Star` (type); `STAR_DESCRIPTIONS` from `constants` (value) | **No** server-only import | 29/21/56/**42**/0 (32); 4,427 CJK chars, the largest file after the home page | Side panel for a clicked star: type badge, 五行/性质/位置/庙旺-落陷 tags, keywords, **古书原文** and **倪海厦老师解读** for 14 major stars, plus 事业/感情/财运/健康 and 最佳/注意宫位; one-liners for 16 auxiliary/sha stars | **Localize but keep unwired** until its quotations are verified; then wire it (the hook already exists: `ChartBoard` `onStarSelect`) | Wiring is a few lines, and the home page already promises it (`app/page.tsx:110` "点击任意主星即可查看倪海厦老师对该星的详细解读", which is false today). But 42 strings are presented as quotes: `古诀：「…」`, `南北山人注：「…」`, `倪师认为…`. The file header cites 顾祥弘《飞星紫微斗数全书》, a modern work. Policy (Hán-Việt original + "Dịch nghĩa") and the content-and-licensing rule (exact quotations) need these verified against a source before they are shown in two languages. |
| `ChatPanel.tsx` | 212 | `motion` (value); `ZiweiChart` (type) | No | 12/0/0/0/5 (0) | Free-text AI chat with 6 preset questions; `fetch('/api/interpret')`; 404 → same `开源版不含 AI 解读接口…` text | **Delete** | It duplicates InsightPanel's chat (topic buttons + 追问 input) against the same 404 endpoint. Keeping both doubles the AI-copy translation work for nothing. |
| `ShareModal.tsx` | 148 | `motion` (value); `ZiweiChart` (type); **`ShareCardCanvas`, `captureShareCard`, `downloadDataURL` (value, `:6`)** | No | 7/0/1/0/3 (0) | Modal: card preview, `⬇ 下载分享图`, `🔗 复制命盘链接`, WeChat/抖音/小红书 tips; calls **`alert()`** on capture failure (`:43`); needs a `shareUrl` prop nobody builds | **Delete** (revisit only if the user approves D4's explicit-share flow, and then build that flow from scratch) | `.claude/rules/demo-ui.md` says not to port "share cards" from the commercial site. The copy targets Chinese social apps. A share URL plus a birth-data PNG is exactly the privacy exposure D4 wants behind an explicit, documented action. |
| `ShareCardCanvas.tsx` | 300 | `ZiweiChart` (type); `SITE_HOST` from `lib/site` (value); **dynamic `import('html2canvas')`** (`:277`; `html2canvas@^1.4.1` is a dependency) | No | 10/22/0/0/0 (0) | 680×420 card: 12-palace mini chart, `紫微命盘 · 倪海厦正宗`, birth date/time and gender, 当前大限, slogan `扫码起你的命盘 →` (no QR code is rendered) | **Delete** (with ShareModal) | Only ShareModal uses it, for the same reasons. If deleted, `html2canvas` becomes an unused dependency; removing it is a separate decision under the plan's no-new-deps rule. |
| `FamousPersonCard.tsx` | 65 | `motion` (value); **`FamousPerson` from `@/lib/ziwei/famous` (`import type`, `:3`)** | **No at runtime.** The import is type-only and erased. Any caller would still need the `FAMOUS_PERSONS` **data**, which lives in server-only `famous.ts:6`, so it would have to be passed from a server component. | 2/3/0/0/1 (5) | Card for a famous person's sample chart: category colour, `{year}年 · 男命/女命`, `命盘亮点：`, a disclaimer that mentions "下方 AI 解读" | **Delete** the component (keep `famous.ts`, which `famous-hour-consistency.test.ts` uses) | No route, no agreed scope, and the UI would present real public figures' birth data with estimated hours plus an AI reading that this repo doesn't have. |

**Totals for the seven:** 295 strings (253 displayable, 42 key), 4,931 CJK chars. If the proposals are accepted as written, the 4 deleted components (ChatPanel, ShareModal, ShareCardCanvas, FamousPersonCard) remove 71 strings, 66 of them displayable. StarDetailPanel's 148 displayable strings (42 of them quotes) move behind a source-verification gate.

---

## 6. Walkthrough log

The headless-Chrome CDP fallback (§1) ran about 70 scripted steps in three runs: the main pass, a follow-up for the fresh-heming and 时辰不详 paths, and a light-theme hydration repro. Each row: action → what appeared (components) → what the static trace missed or got wrong. "SM" = static trace **missed or mispredicted** something.

| # | Route | Action | What appeared | Static-trace note |
|---|---|---|---|---|
| 1 | `/` | load, fresh profile | AnnouncementModal open, `body{overflow:hidden}`, `data-theme=dark`, `lang=zh-CN`, `localStorage` = `[ziwei-theme]` | As predicted. |
| 2 | `/` | click `我知道了` | modal gone; `announcement_seen_2026-05-01 = "1"`; scroll unlocked | — |
| 3 | `/` | list links/buttons | `<a>`: `/knowledge`, `/library`, `/chart` (紫微 ✓ 已上线), **3 `<a>` without `href`** (天纪/地纪/人纪 "6 月 开放", "7 月 开放"), `/terms`, `/privacy`. Buttons: 暗色, 合盘, 立即起盘 ×2, 14 star chips, 4 四化 chips, 开始合盘分析, 免费起盘. | **SM:** the three "coming soon" items are anchors with `href=undefined` and `preventDefault`, so they are interactive-looking but inert (`app/page.tsx:1148-1149`). The dated copy `6 月/7 月 开放` and the `5 月 1 日 — 5 月 8 日` promo are stale time-bound text. |
| 4 | `/` | click theme toggle | aria-label `切换亮色主题` → `切换暗色主题`; `data-theme` → `light`; `ziwei-theme = light` | — |
| 5 | `/` | click `化忌` then `紫微` chip | brief card shows `土·帝王星` | Chips share one `sel` state, so the second click replaces the first card. |
| 6 | `/` | reload (light theme stored) | no modal | **SM:** console `Hydration failed because the server rendered text didn't match the client` (`/`), and `A tree hydrated but some attributes … didn't match` on `/chart` and `/heming`. Cause: `ThemeProvider` initial state reads `<html data-theme>` on the client (`ThemeProvider.tsx:11-20`), while the server always renders `dark` (`暗色` label, inline background colours). Not visible statically as a runtime error. A cookie/localStorage-driven locale initialised the same way would hit the same mismatch. |
| 7 | `/` | console | also: `Encountered a script tag while rendering React component` (inline theme `<script>` in `layout.tsx:43`); framer-motion warning about a non-static scroll container | **SM** (runtime-only warnings). |
| 8 | `/` | click `合盘` / `立即起盘` | → `/heming`, → `/chart` | — |
| 9 | `/chart` | load | `h1 紫微斗数排盘`, 7 selects, submit `立即起盘 · 解命运密码`, hint `* 倪海厦批命用真太阳时…`, default 时辰 `辰时` (08:00, longitude 120) | — |
| 10 | `/chart` | submit empty | `form.checkValidity() = false` on 年份/月份/日期; **no custom errors**; no chart | **SM:** the native `required` attributes (`BirthForm.tsx:245,259,273`) stop the submit event, so `handleSubmit` and the Chinese `FieldError`s never run. The user sees the browser's tooltip, in the browser's language, not the app's. |
| 11 | `/chart` | pick a year, clear it | `✕ 请选择出生年份` | — |
| 12 | `/chart` | 1990-02-30 → submit | `✕ 2月没有30日`; no chart | — |
| 13 | `/chart` | inspect year options | 1900–2026 (127 options) | **SM:** `年份范围：1900–2026` (`BirthForm.tsx:93`) is unreachable from the UI, and 2026 is hard-coded twice (`:93,:248`). |
| 14 | `/chart` | fill 1990-05-10, 北京市/北京, 10:30, ♀ | summary `1990年5月10日 · 北京 · 巳时 · 女`; location `北京 · 经度 116.4°E · 时差 -14 分钟`; `真太阳时 → 巳时` | 10:30 → 10:16 mean solar time = 巳时. All date and time labels are hand-built (`${y}年${m}月${d}日`). |
| 15 | `/chart` | submit | ChartBoard + PalaceCell ×12 + **two TimeNav bars** + InsightPanel (6 topics) + legend; 1 `命理解读` + 404 notice | **SM:** the duplicate TimeNav is in the code but easy to misread as one control; the page shows two identical tab bars. |
| 16 | `/chart` | network | `POST /api/interpret → 404` on mount | As designed. |
| 17 | `/chart` | palace names as rendered | `仆役 迁移 疾厄 财帛 子女 夫妻 兄弟 命宫 父母 福德 田宅 官禄` | Confirms the iztro names: only `命宫` carries 宫, and 交友 shows as `仆役`. |
| 18 | `/chart` | click 命宫, 兄弟, 夫妻 | 三方四正 SVG each time; `命理解读` count 2 → 3 → 4; 3× `POST /api/interpret → 404` | Each click adds another identical 404 notice, so the panel fills with repeats. The prompt carries `主管：` + `PALACE_ROLES[name]`, which is empty for 兄弟/夫妻 (§8). Not visible in the UI because the prompt is hidden. |
| 19 | `/chart` | click 大限 in the **first** (page) TimeNav | label `大限 36–45`; overlay line `大限·乙年四化：…` under the first bar; **0 dashed badges on the board** | **SM:** the page-level TimeNav (`chart/page.tsx:55`) is decoration only. Its `view`/`liunianYear` never reach `ChartBoard` or `InsightPanel`. |
| 20 | `/chart` | click 大限 in the **second** (board) TimeNav | badges `限禄 限科 限忌 限权` on the board | Overlay label says `大限·乙年四化` although the stem is the 大限 palace stem, not a year stem. Wording issue for translation. |
| 21 | `/chart` | board 流年, › › ‹ | year 2026 → 2027; `2027·丁年四化：…`; badges `年科 年禄 年权 年忌` | The year stem is taken from the **Gregorian** year (`TimeNav.tsx:17-19`). Belongs to D1/D3, noted only. |
| 22 | `/chart` | click a dashed badge | nothing; no request | **SM:** `PalaceCell` gives the badge `cursor-pointer` and an `onClick`, but `onSiHuaClick` is not passed by the page, so it looks clickable and does nothing. `InsightPanel.selectedSiHua` and its 飞化 prompt are dormant. |
| 23 | `/chart` | click star `天机` | nothing | **SM:** same pattern. `onStarSelect` is not wired, so StarDetailPanel can't open, contrary to the home-page promise. |
| 24 | `/chart` | topic `事业`; 追问 `测试问题` | user bubble `测试问题` shown, then a 404 notice; total 6 notices | Typed (non-hidden) questions show as user bubbles, so user-typed text appears inside the localized UI. |
| 25 | `/chart` | console | only the 404 resource errors | — |
| 26 | `/chart` @390×844 | resize | grid single column (358px); no horizontal scroll; palace cell 88.75px; topic buttons 53.7px | **SM** (visual): a two-character major star followed by two badges wraps vertically (`天`/`同`). Longer Vietnamese labels (e.g. "Thiên Đồng", "Hóa Lộc") will make this worse. The palace grid is the tightest layout constraint for localization. |
| 27 | `/chart` | `← 重新起盘` | empty form; `localStorage` keys unchanged (`announcement_seen_…`, `ziwei-theme`) | **SM:** `ziwei_history` (`lib/ziwei/history.ts`) and `ziwei-school-config-v1` (`school-config.ts`) are **never written**; no component imports `useHistory` or `loadSchoolConfig`. |
| 28 | `/chart`, `/heming`, `/` @390 | load | `scrollWidth == clientWidth == 390` on all three; heming grid collapses to 1 column | — |
| 29 | `/heming` | load | 2 forms, 0 submit buttons, `开始合盘分析` | — |
| 30 | `/heming` | start, empty / only A filled | `请先填写双方完整出生信息` | `isFormReady` checks only y/m/d/gender/time. Province is optional, and the default time `8:00` always counts as filled. |
| 31 | `/heming` | A 1990-05-10, B 1992-08-20 14:15 上海市 → start | `开源版不含合盘 AI 分析接口（/api/heming）…`; `开始合盘分析` still shown; **no chart rendered**; suggested questions absent | **SM:** both charts are computed and stored (`setChartA/B`, `:108-109`) but never rendered, so heming shows no chart at all in this repo. Suggested questions (I20) are unreachable. |
| 32 | `/heming` | B → 1990-02-30 → start (after the 404) | still the **404 text**; field error `✕ 2月没有30日` | **SM:** `apiMissing` is set true at `:116` and never reset, so the engine `RangeError` path is mislabelled after any earlier 404. |
| 33 | `/heming` (fresh) | A valid, B 1990-02-30 → start | `分析暂时不可用，请重试。`; no network request | Shows the real generic path. |
| 34 | `/heming` | `‹ 返回` | → `/` | — |
| 35 | `/library` | load | 3 book links; `收录 3 部古籍 · 共 75 段精华`; links `/`, `/chart` | — |
| 36 | `/library` | empty search | `搜索` disabled | — |
| 37 | `/library` | `紫微` + Enter | `/library/search?q=%E7%B4%AB%E5%BE%AE`, `共找到 22 条`, first hit `/library/gusuifu/0#gsf-1-1` | — |
| 38 | `/library/search` | no-match `q`; no `q`; `q=<b>x</b>` | empty-state copy; `请输入要搜索的关键词` with heading `「（空）」`; heading shows literal `<b>x</b>` (escaped, no injection) | — |
| 39 | `/library/gusuifu` → `/0#gsf-1-1` | open book and chapter | 9 chapters; chapter has 4 paragraphs, `下一章 →`, no `上一章`; **no `白话`/`倪师注` blocks** | **SM** (data, not code): the translation and 倪师注 UI exists but 0 paragraphs have `translation`/`niNote`. |
| 40 | `/library/nope`, `/library/gusuifu/999` | unknown | Next default **English** 404 | — |
| 41 | `/knowledge` | load | 14 star cards → `/knowledge/<slug>/overview`; **0 topic chips**; counter `= 182 项专题` | **SM:** the counter is computed as 14×13 regardless of data, so it promises 182 topics while 0 exist. |
| 42 | `/knowledge/ziwei/overview` | open a star card | `GET … → 404`, English Next 404 page | Every star card on `/knowledge` leads to a 404. |
| 43 | `/privacy`, `/terms` | load | 908 / 995 chars of text; cross-links | — |
| 44 | `/preview` | load, wait ~6 s, replay | ScrollIntro (`跳 过 →`, 北斗 names) → dev panel (`紫微卷轴 · 开场预览`, links `/`, `/chart`, `/heming`) → replay works; no console errors | **SM:** orphan route (no inbound link, not in sitemap). Its copy speaks to the developer (`如果满意，告诉我…`). |
| 45 | `/does-not-exist` | load | root `<title>` + English 404 body under `lang="zh-CN"` | **SM:** no `app/not-found.tsx`. |
| 46 | `/chart` | 时辰不详 + submit (1990-05-10) | summary `1990年5月10日 · 时辰不详 · 男`; chart renders; `大限 34–43` | — |
| — | `curl` | `/robots.txt`, `/sitemap.xml`, `<head>` of `/chart`, `/privacy`, `/library/gusuifu` | robots as in §2; sitemap 31 URLs; **`<link rel="canonical" href="http://localhost:3000">` on every page checked** | **SM:** the root `alternates.canonical: '/'` is inherited by every route (§8). |

**Side effect of the walkthrough, cleaned up.** `next dev` (16.4.3) wrote a new untracked `AGENTS.md` at the repo root ("Generated AGENTS.md for AI agents"; it can be disabled with `agentRules: false`). I deleted it after stopping the server, so D2 leaves only this file. `next-env.d.ts` and `tsconfig.json` had the same checksums before and after the dev run. Anyone running `npm run dev` in later phases should expect `AGENTS.md` to reappear.

---

## 7. Data-source notes relevant to localization

Most of what a user reads on `/chart` is **not** in `components/`. It comes from engine output and `lib/` constants. The same AST counter run on these `lib/` files (all files, not only what is displayed):

| File | Strings | UI | Term | Prose | Quote | (key) | CJK chars | What reaches the UI today |
|---|--:|--:|--:|--:|--:|--:|--:|---|
| `lib/ziwei/algorithm.ts` | 342 | 261 | 43 | 0 | 0 | 38 | 459 | palace names (iztro zh-CN), star names, `wuxingJuName`, `daXians[].palaceName`, `siHua` values. Engine identifiers must not change (plan's fixed principle). The UI needs a presenter mapping, which is D1's job. |
| `lib/ziwei/constants.ts` | 182 | 26 | 137 | 0 | 0 | 19 | 371 | `STEMS`, `BRANCHES` (干支 in every PalaceCell; 命宫/身宫 branch in the centre), `SHICHEN` (`名`/`range` in BirthForm), `SI_HUA_TABLE` (overlay lines), `JU_NAMES`. `STAR_DESCRIPTIONS` is used only by the unwired StarDetailPanel. |
| `lib/ziwei/cities.ts` | 518 | 515 | 3 | 0 | 0 | 0 | 1,193 | 34 provinces / 484 cities, **Chinese only**, keyed by display name (`PROVINCES.find(p => p.name === …)`, `BirthForm.tsx:70,123,129`). Names are both labels and identifiers, so Vietnamese locations need the stable-ID scheme from D3, not translated names. Its header comment refers to `LocationPicker`, `counties.generated.ts`, `lib/i18n/county-pinyin.generated.ts`, `county-data.ts` and `county-label.ts`, **none of which exist in this repo** (stale comment from the commercial build). |
| `lib/seo/knowledge.ts` | 62 | 2 | 14 | 14 | 0 | 32 | 493 | `ALL_STARS`, `STAR_BRIEF_SEO` (14 one-line prose briefs on `/knowledge`), slugs. |
| `lib/ziwei/db-analysis.ts` | 26 | 13 | 13 | 0 | 0 | 0 | 79 | `TOPIC_LABEL`, `TOPIC_PALACE_NAME` (dormant: no chips, detail 404). `STAR_DB = {}`. |
| `lib/ziwei/patterns.ts` | 641 | 275 | 256 | 44 | 4 | 62 | 4,633 | **Nothing today** (only unwired components import it). In scope once 格局 lands on `/chart`. |
| `lib/ziwei/famous.ts` | 53 | 42 | 0 | 11 | 0 | 0 | 473 | nothing |
| `lib/ziwei/school-config.ts` | 65 | 63 | 1 | 1 | 0 | 0 | 411 | nothing. Option labels exist, but no UI imports them; only `DEFAULT_LEAP_MONTH` is used, by `algorithm.ts`. |
| `lib/ziwei/history.ts` | 5 | 4 | 1 | 0 | 0 | 0 | 5 | nothing (`useHistory` has no importer). **Superseded 2026-11-07:** file deleted (unused React hook in the engine); see `docs/architecture/time-model.md` §1.5. |
| `lib/classics/data/*.ts` | — | — | — | — | — | — | — | Classical text stays Chinese (agreed). **Book and chapter metadata are modern editorial UI text** and need translating: `title`, `dynasty` (`明代`), `author` (`罗洪先 编`, `紫微斗数古籍传承（无确切作者）`), `intro`, and the 21 chapters' `title`/`subtitle` values (e.g. `总论篇`, `十二宫论·命宫`). They appear in `<title>`, breadcrumbs, the TOC and prev/next. |

**Other localization-relevant facts**

- **Engine fields actually displayed:** `palace.name`, `stem`/`branch`, `daXianAge`, `star.name`, `star.siHua`, `star.type` (as colour and row), `star.brightness` (**as colour only**), `mingGongBranch`, `shenGongBranch`, `wuxingJuName`, `daXians[current].{startAge,endAge,palaceName}`, `lunarInfo.{lunarYear,lunarMonth,lunarDay,isLeapMonth}`, `birthInfo.name`.
- **Engine fields not displayed:** `brightnessRaw` (庙旺得利平不闲陷地 is never shown as text on `/chart`; only `bright`/`normal`/`dim` colours), `mingZhu`, `shenZhu`, `fourPillars`, `selfSihua`, `borrowedStars`, `yinYangGender`, 十二神. The D1 terminology audit will cover identifiers the current UI never prints; the presenter only needs the displayed subset for Phase 2 unless the UI is extended.
- **Hand-built dates and numbers:** `BirthForm.tsx:115` (`${y}年${m}月${d}日`); `BirthForm.tsx:97` (`${m}月没有${d}日`); option labels `{mo} 月`, `{dy} 日`, `HH 时`, `MM 分`; `ChartBoard.tsx:175` (`{start}–{end}岁`); `ChartBoard.tsx:182-183` (`lunarYear·[闰]month·day` as raw numbers); `TimeNav.tsx:154` (`${year}·X年四化：`); `ChartSummary.tsx:101-104` (`公历 Y-M-D`, `农历 …年…月…日`); `ShareCardCanvas.tsx:101`. None use `Intl`.
- **String concatenation that won't translate word for word:** `{starName}化{sh}` (`TimeNav.tsx:161`), `` `${s.name}化${s.siHua}` `` (`InsightPanel.tsx:222`), `入{palaceName}` / `{star}入{palaceName}宫` (knowledge pages), `{star}星` (`knowledge/page.tsx:91`), `{name} · 紫微斗数命盘` (`ChartBoard.tsx:111`). These need full-sentence message keys with placeholders.
- **Stored identifiers vs labels:** `BirthFormState.province`/`city` store the Chinese display name. `ziwei_history` (unused today) would store them too. Share URLs (`share.ts:formToSearchParams`, also unused by the UI) encode them.
- **localStorage keys in use at runtime:** `ziwei-theme` (`layout.tsx:43`, `ThemeProvider.tsx:25,33`) and `announcement_seen_2026-05-01` (`AnnouncementModal.tsx:7`). Defined but **never touched at runtime**: `ziwei_history` (`history.ts:4`), `ziwei-school-config-v1` and `ziwei-school-leap-split-migrated` (`school-config.ts:96,98`).
- **URL params in use:** only `q` on `/library/search`. `share.ts` `formToSearchParams`/`searchParamsToForm` have no UI caller.
- **API responses:** none at runtime. Both endpoints 404, so all AI prose (`AiContent` renderers in InsightPanel and heming) is unreachable. Its parser keys on Chinese section markers (`/^\*\*【(.+?)】\*\*$/`, `InsightPanel.tsx:153`, `heming/page.tsx:16`), which matters for the Phase 5 schema.
- **Fonts:** `AnnouncementModal` hard-codes `PingFang SC / Hiragino Sans GB / Microsoft YaHei`, and `/preview` and `ScrollIntro` use `STSong`/`STKaiti`. Fine for Chinese; Vietnamese diacritics will fall back to whatever the system provides there.
- **Tests that read UI source text** (localization edits must keep them passing):
  - `heming-refresh.test.ts:8-10` and `heming-stream.test.ts:6-8` slice `app/heming/page.tsx` between the Chinese comment `  // 表单是否填齐` and `  const cardStyle =`, then execute that slice with a fixed set of injected names. Renaming or translating that comment, or adding a `t(...)` call inside `runAnalysis` (it contains `setFormError('请先填写双方完整出生信息')`), breaks both tests unless they are updated in the same change.
  - `birthform-birthinfo-consistency.test.ts:30` regex-checks `BirthForm.tsx` source for the `formToBirthInfo` import and the absence of `onSubmit({` / `function calcTrueSolarBranch`. It is structural only; strings are safe.

---

## 8. Findings worth the user's attention (reported, not fixed)

1. **`InsightPanel.PALACE_ROLES` keys never match** (`InsightPanel.tsx:132-145`, lookup `:224`). Keys are `'兄弟宫'`, `'夫妻宫'`, …, `'交友宫'`, but iztro emits `'兄弟'`, `'夫妻'`, …, `'仆役'` (observed, step 17). Only `'命宫'` matches; every other palace prompt carries `主管：` followed by nothing. Invisible today (the prompt is hidden and the API 404s). This is the plan's Phase 5 `PALACE_ROLES` fix.
2. **Knowledge templates produce `命宫宫`.** `` `${star}入${data.palaceName}宫` `` (`knowledge/[star]/[topic]/page.tsx:46,48,86,137`), `{data.palaceName}宫` (`:128`) and `其他主星入${data.palaceName}宫` (`:237`) append 宫 to `TOPIC_PALACE_NAME`, which already contains `'命宫'` (`db-analysis.ts:19-20`). Result: `紫微入命宫宫`, and also `仆役宫` for friends. Dormant today because every detail page 404s.
3. **Every `/knowledge` star card links to a 404.** `dynamicParams = false` (`:31`) plus `STAR_DB = {}` gives 0 static params (observed). The comment on `:29-30` says the opposite ("允许动态参数 … 避免 … 404"). `/knowledge` also advertises `= 182 项专题` (`knowledge/page.tsx:46`).
4. **Two TimeNavs on `/chart`, and the page-level one does nothing to the board** (`chart/page.tsx:55-61` vs `ChartBoard.tsx:93-99`). Users see two identical tab bars, and the top one only changes its own caption.
5. **Clickable-looking controls with no handler:** star names (`onStarSelect`), overlay 四化 badges (`onSiHuaClick`, styled `cursor-pointer`), and the `天纪/地纪/人纪` cards (`<a>` with no `href`). The home page claims "点击任意主星即可查看倪海厦老师对该星的详细解读" (`app/page.tsx:110`) and "自动识别11种经典格局" (`:129`, `:434`), but neither is visible in the demo.
6. **Heming:** charts are computed but never rendered (`:108-109`), suggested questions are unreachable without the API (`:295`), and `apiMissing` is never reset, so later failures show the 404 text (step 32).
7. **Hydration mismatch when the stored theme is `light`** (step 6). The cause is `ThemeProvider.getInitialTheme()` reading the DOM on the client. Relevant to Phase 1: the plan's cookie-based `getLocale` on the server avoids this only if the client never derives the locale independently during hydration.
8. **Canonical URL is `/` on every page** (root `alternates.canonical`, `layout.tsx:13-15`; observed on `/chart`, `/privacy`, `/library/gusuifu`). Client pages (`/`, `/chart`, `/heming`, `/preview`) cannot export `metadata`, so they also share the root title. Phase 1's `generateMetadata` work needs server wrappers for these routes.
9. **Native `required` pre-empts the app's own validation messages** (step 10), so the first error a user sees comes from the browser, in the browser's language.
10. **No `app/not-found.tsx`.** 404s show Next's English page under `lang="zh-CN"`, and they are user-reachable from `/knowledge` and from bad library URLs.
11. **`/preview` is a public orphan route** with developer-facing copy. Not linked, not in the sitemap, not blocked by robots.
12. **Legal pages describe the commercial site, not this repo.** Privacy mentions phone numbers, payments, membership login, Anthropic Claude processing and "命盘历史" in localStorage (`privacy/page.tsx:21-57`). Terms forbid decompiling or copying "前端或后端代码" and set a ¥1,000,000-per-case penalty (`terms/page.tsx:32-38`), which conflicts with the repo's MIT `LICENSE`. Terms also render literal `**用于训练任何机器学习模型**` because the markdown asterisks sit inside JSX (`:35`). Translating these as they stand would put inaccurate legal text into Vietnamese; the plan already routes them to legal review.
13. **Time-bound copy:** the AnnouncementModal promo `5 月 1 日 — 5 月 8 日` and its `5 月 3 号开始恢复正常更新`, the home cards `6 月/7 月 开放`, the year cap `2026` (`BirthForm.tsx:93,248`), and the sitemap `lastmod` fixed at 2026-04-28. All of these are past or stale as of 2026-11-07.
14. **Rules-of-hooks violation:** `FeatureVisual` calls `useState` inside `if (index === 1)` (`app/page.tsx:309`). It works only because `index` is stable per instance. Worth knowing before wrapping these blocks in translation hooks.
15. **Quotation provenance:** `StarDetailPanel` (unwired) attributes paraphrases to 倪师 and cites a modern book, and the home page `NI_TEACHINGS` and bio contain direct quotes (`「命运不是人生的全部…」— 倪海厦`, `「飞星（四化）飞来飞去太复杂…」`). The language policy says quotes keep the Chinese original plus "Dịch nghĩa"; each needs a source before translation (D1-style **Verified/Unverified**).
16. **Unused persistence:** `ziwei_history` and the school-config storage are defined but never used by the UI. D3's plan to store calculation parameters "in `ziwei_history` entries and share URLs" would start from zero in this repo: there is no writer today, so there are no legacy entries to migrate from the demo itself.
17. **`next dev` writes `AGENTS.md`** at the repo root on every start (Next 16.4.3). I removed it after this audit. Decide whether to commit it, ignore it, or set `agentRules: false`.
