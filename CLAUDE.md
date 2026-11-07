# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

An open-source snapshot of the Zi Wei Dou Shu (紫微斗数) charting engine behind ouranic.cn, based on 倪海厦《天纪》. It's an npm-workspaces + Turborepo monorepo: the real product is the engine package `packages/ziwei-engine` (`@ziwei/engine`, sources in `src/`), and the Next.js 16 / React 19 / Tailwind app in `apps/web` (`app/`, `components/`, `lib/`) is only a small demo. Turbopack is the Next bundler for both `dev` and `build`.

Open-source boundary (from `README.zh-CN.md` §七; "What is not included" in the English `README.md`): the interpretation database (`packages/ziwei-engine/src/db-analysis.ts` is a placeholder with an empty `STAR_DB`), the AI prompts and every `/api/*` route are **not** included. `fetch('/api/interpret')` and `fetch('/api/heming')` return 404 by design, and the UI shows a "开源版不含该接口" message. Don't treat that as a bug, and don't add API routes unless asked. Existing comments and docs are mostly in Chinese, but on this fork **new technical writing is in English**: comments, docs, commit messages, PRs and CI names. Chart terms that are engine identifiers (四化, 大限, 时辰, star and palace names) stay in Chinese. Don't translate existing Chinese comments as part of unrelated work. See `.claude/rules/workflow.md` → Language.

## Commands

```bash
npm ci                 # install from package-lock.json (CI uses Node 24)
npm run dev            # turbo run dev → next dev in apps/web (port: npm run dev -- -p 3100)
npm run build          # turbo run build → next build in apps/web
npm run typecheck      # turbo run typecheck (each workspace) + tsc for root scripts
npm test               # turbo run test (each workspace's chain) + root repo-wide checks
npx tsx packages/ziwei-engine/test/<name>.test.ts   # run a single test (or apps/web/test/…)
```

There is no lint script and no test framework. Tests live in `packages/ziwei-engine/test/` (engine, baselines in `test/fixtures/`), `apps/web/test/` (web app) and the root `scripts/regression/` (repo-wide checks). Each is a plain `tsx` script that uses `node:assert/strict` or a hand-written fail counter, logs a message, and exits non-zero on failure. **A new test file must be appended by hand to the `test` script in its workspace's `package.json`**, or it will never run (`check-repo-guards.mjs` fails on an unregistered file). CI (`.github/workflows/ci.yml`) runs `typecheck` and then `test` on every push and PR.

To inspect a real chart instead of reasoning about engine output, run `npx tsx .claude/skills/chart/chart.ts --date YYYY-MM-DD (--time HH:MM [--lng E] | --hour 0-11) --gender male|female` (this is the `chart` skill). `--sweep` prints 832 charts deterministically, which makes before/after diffs easy; the `chart-diff-reviewer` agent uses it. Project hooks in `.claude/settings.json`:
- After every edit to a `.ts`/`.tsx` file, `tsc` runs.
- When you stop with changes under `packages/ziwei-engine/`, `apps/web/test/`, `scripts/regression/` or a `package.json`, `npm test` runs.
- Edits are blocked for generated files, `docs/tianji-ziwei/`, `package-lock.json` and `.env*`.
- Edits in the main checkout are blocked. **Implementation and bug fixes happen in a git worktree:** start with `/start-work <type> <slug>` and finish with `/ship`. Details are in `.claude/rules/workflow.md` → Worktrees.

Remotes: `origin` is the fork `thangnc/ziwei-doushu`, where PRs go; `upstream` is `Renhuai123/ziwei-doushu`.

The committed `apps/web/tsconfig.json` and `apps/web/next-env.d.ts` are what `next build` writes, and CI fails if a build leaves them changed. `next dev` still rewrites `next-env.d.ts` to point at `.next/dev/types` and generates a gitignored `apps/web/AGENTS.md`. Don't commit that dev edit; restore it with `git checkout -- apps/web/next-env.d.ts`. If a Next upgrade makes `next build` rewrite either file, commit the new build version.

To reproduce CI exactly, run the steps in the digest-pinned image from `ci.yml` with `docker run --platform linux/amd64` on a copy of the repo. `neutral-naming.test.ts` calls `git ls-files`, so the copy needs a git index; a worktree's `.git` is only a pointer file, so run `git init && git add -A` inside the copy. Regenerate `package-lock.json` (hand edits are blocked by a hook) with `npm install --package-lock-only` in that same image, so the npm version matches.

## Knowledge map

Read the doc for the area before changing it. `docs/README.md` indexes everything under `docs/`.

| Area | Read first | Check |
|---|---|---|
| Engine (`packages/ziwei-engine/`) | `docs/architecture/time-model.md` (birth time), `docs/architecture/engine-protection.md` (imports, bundle, privacy), `docs/solutions/engine/`, `docs/solutions/` category `time` (none recorded yet) | `chart-diff-reviewer`, `npm test` |
| Baselines | `packages/ziwei-engine/test/fixtures/README.md`, `docs/solutions/baselines/` | `npm test` (3 baseline bodies) |
| i18n and UI | `apps/web/lib/i18n/README.md`, `docs/decisions/localization.md`, `docs/audits/terminology-audit.md`, `docs/audits/ui-inventory.md` | `npm run build` |
| CI, git, worktrees, hooks | `docs/solutions/ci/`, `docs/solutions/workflow/` | `node .github/scripts/check-repo-guards.mjs` |

**Prior fixes:** `docs/solutions/<category>/` holds one lesson per file (problem, root cause, solution, prevention) with greppable frontmatter (`module`, `tags`, `problem_type`). Search it when an area has a prior fix, e.g. `grep -rl "share.ts" docs/solutions` (docs written before the 2026-11-08 monorepo move name the old path `lib/ziwei/<file>` in `module`). When a fix teaches a durable lesson, record it with `/record-solution` in the same PR; the repo, not personal memory, is the record. Schema and rules: `docs/solutions/README.md`.

## Engine architecture (`packages/ziwei-engine/src/`)

**Entry point:** `generateChart(birthInfo, { leapMonth? })` in `algorithm.ts` returns a `ZiweiChart`. It wraps **iztro** (`astro.bySolar`, or `astro.byLunar` for leap-month policies) and then post-processes the result:
- Validates inputs and throws `RangeError` for a non-integer or out-of-range `hour`, a `gender` other than exactly `'male'`/`'female'`, or a Gregorian date that doesn't exist. iztro would otherwise silently roll the date forward.
- Rebuilds the 12 palaces (`Palace[]`, ordered by earthly-branch index 0–11) from iztro's palaces. Star brightness is looked up from the school tables via `schoolStarBrightness(...)` (`school-data.ts`); iztro's own brightness is ignored.
- Applies school-specific corrections on top of iztro: `applySchoolKuiyue`, `applySchoolJiekong`, `applySchoolDahao` and `applySchoolFuxun`.

**Conventions that are easy to get wrong:**
- `BirthInfo.hour` is a **时辰 branch index from 0 to 11** (子=0 … 亥=11), not a clock hour. `BirthInfo.year/month/day` is the *charting day*, so the late-子时 day change and true-solar-time correction have already been applied.
- Late-子时 day change and true solar time happen **before** `generateChart`, in `share.ts` (`formToBirthInfo`). That function uses `branchFromSolarMinutes` and `resolveZiweiDayOffset` from `true-solar-time.ts`, so both the branch and the day change follow true solar time when a longitude is given. `clock-adjust.ts` and `dst-cn.ts` only *detect* DST and timezone shifts; the user confirms an adjustment, and nothing is subtracted automatically.
- The year changes at 正月初一 (lunar year), not at 立春. This choice matches mainstream charting software; see the header comment in `algorithm.ts`.
- iztro zh-CN palace names: only 命宫 keeps the 「宫」 suffix (`'命宫','兄弟','夫妻',…`), and 交友 is called `'仆役'`.
- A 四化 is stored as `star.siHua` (`'禄'|'权'|'科'|'忌'`) on the star itself, not as a separate star named 「化X」. `patterns.ts` must check `siHua`.
- Brightness school state is **module-global** (`setBrightnessSchool` mutates `currentBrightSchool`; the default is `'QS'`, i.e. 《斗数全书》). It affects every later `generateChart` call in the same process.

**School (流派) options:** `school-config.ts` defines `SchoolConfig` (brightness, 庚年四化, 天马, 截空, 魁钺, late 子时, leap month, …) and URL-param encoding; its localStorage persistence lives outside the engine in `apps/web/lib/school-config-storage.ts`. In the demo, only the leap-month policy is passed through to `generateChart`; the other options are definitions without wiring. `school-tables.generated.ts` is generated ("勿手改"). Its generator, `scripts/extract-school-tables.ts`, isn't in this repo, so edit it only with clear evidence.

**Other modules:** `sihua.ts` (四化 tables for natal, 大限, 流年, 流月, 流日 and 流时 levels, plus self-化 detection; natal 四化 stay fixed and are not flown), `yunxian-context.ts` (大限 and year helpers, including 童限 as `CHILDHOOD_DAXIAN_INDEX = -2`), `patterns.ts` (`detectPatterns`, a rule base of about 1100 lines), `shier-shen.ts`, `lunar-solar.ts`, `cities.ts` (longitudes for true solar time), `famous.ts` (sample charts; `hour` is again a branch index, pinned by a regression test).

**Other data in `apps/web/lib/`:** `classics/` (public-domain classical texts behind the `/library` reader), `seo/knowledge.ts` (14 major stars × 12 palaces for `/knowledge`), `nihai/` (倪海厦 content metadata), and `docs/tianji-ziwei/` (1848 quoted lines from 倪师, licensed CC BY-NC-SA, non-commercial).

## Demo UI flow

`apps/web/app/chart/page.tsx`: `BirthForm` → `formToBirthInfo` → `generateChart` → `ChartBoard` / `PalaceCell` + `InsightPanel` + `TimeNav` (本命, 大限 and 流年 views). `apps/web/app/heming/page.tsx` builds both charts locally with the same engine; only its AI analysis call 404s. Charts are generated entirely in the browser, and no API keys are needed (`.env.example` matters only if you implement `/api/*` yourself).

## Rules

Detailed rules are in `.claude/rules/`. Most load only when Claude works on matching files.
- `workflow.md` (always loaded): verifying before claiming done, one change per PR, working in worktrees, language (English for new technical writing), commit and PR style, privacy of birth data.
- `engine.md` (`packages/ziwei-engine/**`): evidence required for any change to chart output, school options instead of hard-coded fixes, engine invariants.
- `regression-tests.md` (the three test directories, any `package.json`): test house style and registration.
- `demo-ui.md` (`apps/web/app/**`, `apps/web/components/**`): no backend, no `server-only` modules in client components.
- `knowledge-base.md` (`docs/solutions/`, `docs/architecture/`, `docs/decisions/`, `docs/audits/`): the solution-doc format, update instead of duplicate, dated supersede notes, back-links from code.
- `content-and-licensing.md` (`docs/tianji-ziwei/`, classics, README): exact quotations, separate licences, keeping both READMEs in sync (`README.md` English by default, `README.zh-CN.md` Chinese).
