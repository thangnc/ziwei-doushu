---
name: add-regression
description: Scaffold a new regression test in the right workspace (packages/ziwei-engine/test for engine behaviour, apps/web/test for the web app), register it in that package.json test chain, and run it. Use for any change that alters chart output (required by CONTRIBUTING.md) or when pinning a fixed bug.
argument-hint: "<kebab-name> <what behaviour to pin>"
disable-model-invocation: true
---

# add-regression

Add one regression test for: **$ARGUMENTS**

## Steps

1. **Pick the place and name.** Engine behaviour: `packages/ziwei-engine/test/<kebab-name>.test.ts`. Web app (components, pages, i18n): `apps/web/test/<kebab-name>.test.ts`. Repo-wide checks only: root `scripts/regression/`. Run `ls` on that directory and make sure the name is new.

2. **Find out the expected values; don't invent them.** If the test asserts star placements or other chart output, generate the chart first:
   `npx tsx .claude/skills/chart/chart.ts --date … --hour … --gender …`
   Assert only values that have a source, such as a classical text, a reference chart from other software, or the bug report. Cite that source in the header comment.

3. **Write the test in the house style.** Follow the existing tests, e.g. `gender-validation.test.ts` and `hongluan-tianxi.test.ts`:
   - Start with a header doc comment, in English, that says why this test exists and what the source is. Older tests have Chinese headers; leave those as they are.
   - Engine tests import the engine relatively (`../src/algorithm`); web tests import it as `@ziwei/engine/algorithm` and web code relatively (`../lib/...`).
   - Use `import assert from 'node:assert/strict'`. Each assertion message should state the expected rule.
   - No test framework. End with a `console.log('<name> regression passed')`. Any thrown assertion exits non-zero.
   - Importing `patterns.ts` or `famous.ts` from the engine needs the `server-only` stub. Copy the `registerHooks` block from `patterns-sihua-bonus.test.ts`.
   - BirthInfo inputs are the charting day with `hour` as a 时辰 index from 0 to 11. If you're testing time correction, go through `formToBirthInfo` in `packages/ziwei-engine/src/share.ts`.

4. **Register it.** Append ` && tsx test/<kebab-name>.test.ts` to the end of `scripts.test` in that workspace's `package.json` (root `scripts/regression/` tests: ` && tsx scripts/regression/<kebab-name>.test.ts` in the root `package.json`). Edit only that string; keep the rest of the chain unchanged. CI runs only what's listed there, and `node .github/scripts/check-repo-guards.mjs` fails on an unregistered file.

5. **Verify.**
   - `npx tsx <workspace>/test/<kebab-name>.test.ts` passes (run from the repo root).
   - If it pins a bug fix, check that it **fails without the fix**: `git stash` the source change, run the test, then `git stash pop`. Tell the user if it can't fail.
   - `npm run typecheck` and `npm test` pass.

6. Report the file, what it asserts, the evidence source, and the pass/fail results from step 5.
