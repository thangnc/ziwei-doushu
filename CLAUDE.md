# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

An open-source snapshot of the Zi Wei Dou Shu (紫微斗数) charting engine behind ouranic.cn, based on 倪海厦《天纪》. It's a Next.js 16 / React 19 / Tailwind app, but the real product is the engine in `lib/ziwei/`. The UI under `app/` and `components/` is only a small demo.

Open-source boundary (from `README.zh-CN.md` §七; "What is not included" in the English `README.md`): the interpretation database (`lib/ziwei/db-analysis.ts` is a placeholder with an empty `STAR_DB`), the AI prompts and every `/api/*` route are **not** included. `fetch('/api/interpret')` and `fetch('/api/heming')` return 404 by design, and the UI shows a "开源版不含该接口" message. Don't treat that as a bug, and don't add API routes unless asked. Existing comments and docs are mostly in Chinese, but on this fork **new technical writing is in English**: comments, docs, commit messages, PRs and CI names. Chart terms that are engine identifiers (四化, 大限, 时辰, star and palace names) stay in Chinese. Don't translate existing Chinese comments as part of unrelated work. See `.claude/rules/workflow.md` → Language.

## Commands

```bash
npm ci                 # install from package-lock.json (CI uses Node 24)
npm run dev            # next dev
npm run build
npm run typecheck      # tsc --noEmit
npm test               # every regression script, chained with &&
npx tsx scripts/regression/<name>.test.ts   # run a single regression test
```

There is no lint script and no test framework. Each test in `scripts/regression/` is a plain `tsx` script that uses `node:assert/strict` or a hand-written fail counter, logs a message, and exits non-zero on failure. **A new test file must be appended to the `test` script in `package.json` by hand**, or it will never run. CI (`.github/workflows/ci.yml`) runs `typecheck` and then `test` on every push and PR.

To inspect a real chart instead of reasoning about engine output, run `npx tsx .claude/skills/chart/chart.ts --date YYYY-MM-DD (--time HH:MM [--lng E] | --hour 0-11) --gender male|female` (this is the `chart` skill). `--sweep` prints 832 charts deterministically, which makes before/after diffs easy; the `chart-diff-reviewer` agent uses it. Project hooks in `.claude/settings.json`:
- After every edit to a `.ts`/`.tsx` file, `tsc` runs.
- When you stop with changes under `lib/ziwei/`, `scripts/regression/` or `package.json`, `npm test` runs.
- Edits are blocked for generated files, `docs/tianji-ziwei/`, `package-lock.json` and `.env*`.
- Edits in the main checkout are blocked. **Implementation and bug fixes happen in a git worktree:** start with `/start-work <type> <slug>` and finish with `/ship`. Details are in `.claude/rules/workflow.md` → Worktrees.

Remotes: `origin` is the fork `thangnc/ziwei-doushu`, where PRs go; `upstream` is `Renhuai123/ziwei-doushu`.

`next dev` on Next 16 rewrites `next-env.d.ts` and `tsconfig.json` (`jsx`, `.next/dev/types`) and generates a gitignored `AGENTS.md`. Don't commit those generated edits unless that's the point of the change; restore them with `git checkout -- next-env.d.ts tsconfig.json`.

To reproduce CI exactly, run the steps in the digest-pinned image from `ci.yml` with `docker run --platform linux/amd64` on a copy of the repo. `neutral-naming.test.ts` calls `git ls-files`, so the copy needs a git index; a worktree's `.git` is only a pointer file, so run `git init && git add -A` inside the copy. Regenerate `package-lock.json` (hand edits are blocked by a hook) with `npm install --package-lock-only` in that same image, so the npm version matches.

## Engine architecture (`lib/ziwei/`)

**Entry point:** `generateChart(birthInfo, { leapMonth? })` in `algorithm.ts` returns a `ZiweiChart`. It wraps **iztro** (`astro.bySolar`, or `astro.byLunar` for leap-month policies) and then post-processes the result:
- Validates inputs and throws `RangeError` for a non-integer or out-of-range `hour`, a `gender` other than exactly `'male'`/`'female'`, or a Gregorian date that doesn't exist. iztro would otherwise silently roll the date forward.
- Rebuilds the 12 palaces (`Palace[]`, ordered by earthly-branch index 0–11) from iztro's palaces. Star brightness is looked up from the school tables via `schoolStarBrightness(...)` (`school-data.ts`); iztro's own brightness is ignored.
- Applies school-specific corrections on top of iztro: `applySchoolKuiyue`, `applySchoolJiekong`, `applySchoolDahao` and `applySchoolFuxun`.

**Conventions that are easy to get wrong:**
- `BirthInfo.hour` is a **时辰 branch index from 0 to 11** (子=0 … 亥=11), not a clock hour. `BirthInfo.year/month/day` is the *charting day*, so the late-子时 day change and true-solar-time correction have already been applied.
- Late-子时 day change and true solar time happen **before** `generateChart`, in `lib/ziwei/share.ts` (`formToBirthInfo`). That function uses `branchFromSolarMinutes` and `resolveZiweiDayOffset` from `true-solar-time.ts`, so both the branch and the day change follow true solar time when a longitude is given. `clock-adjust.ts` and `dst-cn.ts` only *detect* DST and timezone shifts; the user confirms an adjustment, and nothing is subtracted automatically.
- The year changes at 正月初一 (lunar year), not at 立春. This choice matches mainstream charting software; see the header comment in `algorithm.ts`.
- iztro zh-CN palace names: only 命宫 keeps the 「宫」 suffix (`'命宫','兄弟','夫妻',…`), and 交友 is called `'仆役'`.
- A 四化 is stored as `star.siHua` (`'禄'|'权'|'科'|'忌'`) on the star itself, not as a separate star named 「化X」. `patterns.ts` must check `siHua`.
- Brightness school state is **module-global** (`setBrightnessSchool` mutates `currentBrightSchool`; the default is `'QS'`, i.e. 《斗数全书》). It affects every later `generateChart` call in the same process.

**School (流派) options:** `school-config.ts` defines `SchoolConfig` (brightness, 庚年四化, 天马, 截空, 魁钺, late 子时, leap month, …), localStorage persistence and URL-param encoding. In the demo, only the leap-month policy is passed through to `generateChart`; the other options are definitions without wiring. `school-tables.generated.ts` is generated ("勿手改"). Its generator, `scripts/extract-school-tables.ts`, isn't in this repo, so edit it only with clear evidence.

**Other modules:** `sihua.ts` (四化 tables for natal, 大限, 流年, 流月, 流日 and 流时 levels, plus self-化 detection; natal 四化 stay fixed and are not flown), `yunxian-context.ts` (大限 and year helpers, including 童限 as `CHILDHOOD_DAXIAN_INDEX = -2`), `patterns.ts` (`detectPatterns`, a rule base of about 1100 lines), `shier-shen.ts`, `lunar-solar.ts`, `cities.ts` (longitudes for true solar time), `famous.ts` (sample charts; `hour` is again a branch index, pinned by a regression test).

**Other `lib/` data:** `lib/classics/` (public-domain classical texts behind the `/library` reader), `lib/seo/knowledge.ts` (14 major stars × 12 palaces for `/knowledge`), `lib/nihai/` (倪海厦 content metadata), and `docs/tianji-ziwei/` (1848 quoted lines from 倪师, licensed CC BY-NC-SA, non-commercial).

## Demo UI flow

`app/chart/page.tsx`: `BirthForm` → `formToBirthInfo` → `generateChart` → `ChartBoard` / `PalaceCell` + `InsightPanel` + `TimeNav` (本命, 大限 and 流年 views). `app/heming/page.tsx` builds both charts locally with the same engine; only its AI analysis call 404s. Charts are generated entirely in the browser, and no API keys are needed (`.env.example` matters only if you implement `/api/*` yourself).

## Rules

Detailed rules are in `.claude/rules/`. Most load only when Claude works on matching files.
- `workflow.md` (always loaded): verifying before claiming done, one change per PR, working in worktrees, language (English for new technical writing), commit and PR style, privacy of birth data.
- `engine.md` (`lib/ziwei/**`): evidence required for any change to chart output, school options instead of hard-coded fixes, engine invariants.
- `regression-tests.md` (`scripts/regression/**`, `package.json`): test house style and registration.
- `demo-ui.md` (`app/**`, `components/**`): no backend, no `server-only` modules in client components.
- `content-and-licensing.md` (docs, classics, README): exact quotations, separate licences, keeping both READMEs in sync (`README.md` English by default, `README.zh-CN.md` Chinese).
