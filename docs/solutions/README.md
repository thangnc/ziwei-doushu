# Solutions: lessons already paid for

One file per lesson learned in this repo: what went wrong, why, how it was fixed, and how to stop it happening again. **Before changing an area, search here for a prior fix.** After a fix that teaches something durable, record it with `/record-solution`.

The format is checked in CI by `.github/scripts/check-repo-guards.mjs` (check 3, in the `Repository guards` job). Run it locally with `node .github/scripts/check-repo-guards.mjs`.

## Finding a lesson

```bash
grep -rl "tags:.*worktree" docs/solutions         # by tag
grep -rl "share.ts" docs/solutions   # by module (docs before 2026-11-08 use the old path lib/ziwei/<file>)
grep -rh "^title:" docs/solutions                  # every lesson, one line each
```

## Layout

`docs/solutions/<category>/<lesson-as-a-slug>.md`. The categories are:

| Category | For lessons about |
|---|---|
| `engine` | chart construction, iztro and lunar-javascript behaviour, school options, patterns |
| `time` | birth time, true solar time, timezones, DST, calendars |
| `baselines` | the baseline fixtures and the canonical Node container |
| `ci` | GitHub Actions workflows and repository guards |
| `workflow` | git, the fork, worktrees, Claude Code hooks, skills and rules |
| `docs` | READMEs and docs that disagreed with the code |

A new category needs this table and `CATEGORIES` in the guard script updated in the same PR.

## Template

```markdown
---
title: "The lesson as one sentence, not the symptom"
date: 2026-11-07
category: ci
module: .github/workflows/ci.yml
problem_type: bug
severity: medium
tags: [container, git]
related: ["PR #2", "docs/solutions/ci/another-lesson.md"]
---

## Problem
What happened, with the exact error text or wrong output.

## Root cause
Why it happened, traced to code, config or an upstream behaviour (cite file:line where useful).

## Solution
What fixed it: the change, the command, the PR.

## Prevention
What now stops it recurring (a test, a guard, a rule, a hook), or how to notice it early.

## Related
Issues, PRs, other solution docs, the regression test that pins it.
```

**Frontmatter** (all required except `related`):
- `title`: the lesson, in English.
- `date`: `YYYY-MM-DD`, the day the lesson was learned.
- `category`: must equal the folder name.
- `module`: the file, directory or area the lesson is about.
- `problem_type`: one of `bug`, `convention`, `tooling`, `workflow`, `docs`.
- `severity`: one of `low`, `medium`, `high`.
- `tags`: a non-empty `[list]`.
- `related` (optional): a `[list]` of PRs, issues or other docs.

Keep each value on one line. `#` comments aren't supported in the frontmatter.

**Sections:** `## Problem`, `## Root cause`, `## Solution` and `## Prevention` are required; `## Related` is optional.

## Rules

- **Title the file with the lesson**, not the symptom: `hooks-must-resolve-the-edited-files-checkout…`, not `protect-files-broken`.
- **One lesson per file. Update an existing file** instead of adding a near-duplicate; search first.
- **Only verified facts.** Quote the real error text, commands and PR numbers. Never invent evidence or reconstruct it from memory.
- **Don't rewrite history.** When a lesson is superseded, add a dated note (`**Superseded 2026-12-01:** …`) and keep the original text.
- **Back-link from code.** When a regression test or code comment exists because of a lesson, it cites the file path here.
- Write in English. Chart identifiers (四化, 大限, 时辰, star and palace names) stay in Chinese.
