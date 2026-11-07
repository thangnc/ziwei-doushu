## Summary

<!-- What changed and why, in one or two sentences. Link related issues as #number. -->

## Type of change

<!-- Matches the Conventional Commits type in the PR title, which CI checks. -->

- [ ] `fix`: bug fix
- [ ] `feat`: new feature or school option
- [ ] `refactor` / `perf`: no behaviour change
- [ ] `test`: regression tests only
- [ ] `docs`: documentation
- [ ] `ci` / `build` / `chore`: CI, dependencies, tooling

## Affected areas

- [ ] Chart engine (`lib/ziwei/`)
- [ ] Birth form / true solar time / 时辰 (`share.ts`, `true-solar-time.ts`)
- [ ] Chart board / time navigation (大限 / 流年)
- [ ] 合盘 (`/heming`)
- [ ] Library / Knowledge
- [ ] Localization (`lib/i18n/`)
- [ ] Regression tests / baseline fixtures
- [ ] CI / `.github/`
- [ ] Other: <!-- specify -->

## Chart output

<!-- Pick one. Any change to chart output needs evidence (.claude/rules/engine.md). -->

- [ ] No change: the baseline fixtures pass unchanged (or the PR doesn't touch the engine)
- [ ] Changed on purpose: the `chart-diff-reviewer` report (or a `chart.ts --sweep` diff) and the evidence are below: a cited passage, a 《天纪》 time code, or a reference chart from other software
- [ ] Baselines regenerated in the canonical container, following `scripts/regression/fixtures/README.md`

## Verification

<!-- Paste the real results, not "should pass". -->

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] UI changes checked in the browser (say which pages, and attach screenshots), or: not checked in a browser, because <!-- reason -->

## Checklist

- [ ] One change in this PR (or the description says why it's bundled)
- [ ] New regression tests are added to the `test` script in `package.json` (CI's repository guards fail otherwise)
- [ ] The title follows Conventional Commits, in English; new comments and docs are in English
- [ ] The `next dev` rewrite of `next-env.d.ts` isn't committed
- [ ] No `.env.local`, keys, or anyone's real birth data are committed
