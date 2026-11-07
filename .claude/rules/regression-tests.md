---
paths:
  - "scripts/regression/**"
  - "package.json"
---

# Regression test rules

- There's no test framework. Each test is a standalone `tsx` script that uses `node:assert/strict`, ends with `console.log('<name> regression passed')`, and exits non-zero on failure. Don't add vitest or jest.
- **Register every new test**: append ` && tsx scripts/regression/<name>.test.ts` to `scripts.test` in `package.json`. CI runs only that chain, so an unregistered file never runs. Never reorder or drop existing entries.
- Name tests after the behaviour they pin (`leap-policy-validation`, `sizhu-lichun-boundary`), not after an issue number. Put the issue or PR number in the header comment.
- The header comment (in English for new tests; existing tests keep their Chinese headers) states why the test exists and **the source of every expected value**. Expected values come from a reference (classical text, reference chart, bug report), never from whatever the engine currently outputs. Snapshotting current output only freezes bugs in place.
- If the fix a test pins has a solution doc in `docs/solutions/`, cite that doc's path in the header comment, and name the test in the doc's `## Related`.
- A test that pins a bug fix must fail without the fix. Check with `git stash` before claiming it does.
- Use relative imports (`../../lib/ziwei/...`). `tsx` resolves `@/`, but the existing tests don't use it.
- Importing `patterns.ts` or `famous.ts` needs the `server-only` stub; copy the `registerHooks` block from `patterns-sihua-bonus.test.ts`. For `famous.ts` data, parsing the source file is an alternative (see `famous-hour-consistency.test.ts`).
- Keep each test fast (well under a few seconds); the whole suite runs on every Stop hook and in CI. Sample input combinations instead of looping over every date.
- Tests that switch brightness school or other global state must restore it at the end.
- Use only synthetic birth data or published sample charts from `famous.ts`. Never use a real private person's birth data.

## Change-detector baselines (`scripts/regression/fixtures/`)

- `engine-baseline`, `patterns-baseline` and `birthtime-baseline` are a deliberate exception to the "no snapshots" rule. They detect **any** change in engine output during localization and refactoring; they don't prove correctness. Never use them as the source of expected values in other tests.
- Tests compare **only the body**. Environment metadata (Node, ICU, tzdata, OS, git) produces an informational report, never a failure.
- **Never regenerate a fixture to make a test pass.** A body mismatch needs investigating. Regenerate only with `generate-baselines.ts --write`, in the canonical container from `fixtures/README.md`, alongside a `chart-diff-reviewer` report and evidence for the change. Tests and hooks never write fixtures.
