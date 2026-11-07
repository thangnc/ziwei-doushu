---
name: record-solution
description: Record a lesson learned in this session as a docs/solutions/<category>/<lesson>.md file (problem, root cause, solution, prevention) in the checked format, and back-link it from the regression test that pins the fix. Use after a fix that taught something durable.
argument-hint: "<the lesson in a few words>"
disable-model-invocation: true
---

# record-solution

Record this lesson: **$ARGUMENTS**

Rules: `docs/solutions/README.md` (schema, categories, template) and `.claude/rules/knowledge-base.md`. Run each command plainly and separately; this usually runs in a worktree-isolated session.

## Steps

1. **In a worktree.** `git rev-parse --path-format=absolute --git-dir` must differ from `--git-common-dir`. If not, stop and suggest `/start-work docs <slug>`, or add the doc to the worktree of the fix it belongs to (preferred: same PR as the fix).
2. **Search first.** Look for an existing doc on the same lesson:
   - `grep -rh "^title:" docs/solutions`
   - `grep -rl "module: <path>" docs/solutions` and `grep -rl "tags:.*<tag>" docs/solutions`

   If one exists, update it (add facts, or a dated `**Superseded YYYY-MM-DD:**` note) instead of writing a new file.
3. **Collect the facts** from this session and the repo only: the exact error text or wrong output, the `file:line` of the root cause, the command or change that fixed it, the PR or issue number, and what now prevents it (test, guard, rule, hook). If a fact can't be verified, leave it out or mark it unverified. Never invent evidence.
4. **Write the file** at `docs/solutions/<category>/<lesson-as-a-slug>.md` using the template in `docs/solutions/README.md`:
   - Pick the category from the README table. A new category needs the README table and `CATEGORIES` in `.github/scripts/check-repo-guards.mjs` changed in the same PR; ask the user first.
   - `title` states the lesson as one sentence, not the symptom. The slug follows the title.
   - `date` is today's date; `category` equals the folder; `module` is the main file or area.
   - Sections: `## Problem`, `## Root cause`, `## Solution`, `## Prevention`, and `## Related` with PR/issue numbers and the test that pins the fix.
   - English; chart identifiers stay in Chinese.
5. **Back-link.** If a regression test pins the fix, add the doc path to that test's header comment (one line). Change only tests that this lesson is about.
6. **Check:**
   - `node .github/scripts/check-repo-guards.mjs` must pass ("Knowledge base: N solution doc(s) checked").
   - Every relative link in the new doc resolves.
7. **Report** the file path and a one-line summary. Commit with the fix, or finish with `/ship` if it's a separate docs PR.
