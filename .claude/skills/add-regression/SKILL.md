---
name: add-regression
description: Scaffold a new regression test in scripts/regression/, register it in the package.json test chain, and run it. Use for any change that alters chart output (required by CONTRIBUTING.md) or when pinning a fixed bug.
argument-hint: "<kebab-name> <what behaviour to pin>"
disable-model-invocation: true
---

# add-regression

Add one regression test for: **$ARGUMENTS**

## Steps

1. **Pick the name.** Use `scripts/regression/<kebab-name>.test.ts`. Run `ls scripts/regression/` and make sure the name is new.

2. **Find out the expected values; don't invent them.** If the test asserts star placements or other chart output, generate the chart first:
   `npx tsx .claude/skills/chart/chart.ts --date … --hour … --gender …`
   Assert only values that have a source, such as a classical text, a reference chart from other software, or the bug report. Cite that source in the header comment.

3. **Write the test in the house style.** Follow the existing tests, e.g. `gender-validation.test.ts` and `hongluan-tianxi.test.ts`:
   - Start with a header doc comment, in English, that says why this test exists and what the source is. Older tests have Chinese headers; leave those as they are.
   - Use relative imports such as `../../lib/ziwei/algorithm`, not `@/`.
   - Use `import assert from 'node:assert/strict'`. Each assertion message should state the expected rule.
   - No test framework. End with a `console.log('<name> regression passed')`. Any thrown assertion exits non-zero.
   - Importing `lib/ziwei/patterns.ts` or `lib/ziwei/famous.ts` needs the `server-only` stub. Copy the `registerHooks` block from `patterns-sihua-bonus.test.ts`.
   - BirthInfo inputs are the charting day with `hour` as a 时辰 index from 0 to 11. If you're testing time correction, go through `formToBirthInfo` in `lib/ziwei/share.ts`.

4. **Register it.** Append ` && tsx scripts/regression/<kebab-name>.test.ts` to the end of `scripts.test` in `package.json`. Edit only that string; keep the rest of the chain unchanged. CI runs only what's listed there.

5. **Verify.**
   - `npx tsx scripts/regression/<kebab-name>.test.ts` passes.
   - If it pins a bug fix, check that it **fails without the fix**: `git stash` the source change, run the test, then `git stash pop`. Tell the user if it can't fail.
   - `npm run typecheck` and `npm test` pass.

6. Report the file, what it asserts, the evidence source, and the pass/fail results from step 5.
