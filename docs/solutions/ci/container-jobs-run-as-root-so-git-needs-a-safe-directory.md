---
title: "CI jobs in a container run as root, so git needs the workspace marked as a safe directory"
date: 2026-11-07
category: ci
module: .github/workflows/ci.yml
problem_type: bug
severity: medium
tags: [ci, container, git, safe-directory, neutral-naming]
related: ["PR #2", "scripts/regression/neutral-naming.test.ts"]
---

## Problem

After the CI test job moved into the digest-pinned `node:*-bookworm` container, `neutral-naming.test.ts` failed in CI while passing locally. The test calls `git ls-files`, and git refused the checkout with a "dubious ownership" error.

## Root cause

`actions/checkout` creates the workspace as the runner user, but the job's container runs as root. Since git 2.35.2, git refuses to operate on a repository owned by a different user unless it's listed in `safe.directory`.

A related trap when reproducing CI locally: a copy of the repo without `.git` fails the same test, and a git **worktree's** `.git` is only a pointer file to the main checkout's git directory, so copying it into a container doesn't give git a usable repository either.

## Solution

Add a step after checkout in every container job that runs git (or tests that call git):

```yaml
- name: Mark workspace as a git safe directory
  run: git config --global --add safe.directory "$GITHUB_WORKSPACE"
```

For a local container repro, copy the repo without `node_modules`, `.next` and `.git`, then run `git init -q && git add -A` inside the copy so `git ls-files` has an index.

## Prevention

- The step is in each container job in `.github/workflows/ci.yml` that runs the regression tests; keep it when adding or splitting jobs.
- `CLAUDE.md` documents the local repro recipe ("To reproduce CI exactly …").

## Related

- PR #2 (the commit that moved the check job into the pinned container).
- `scripts/regression/fixtures/README.md`, Phase 0 observations (the first container attempt failed for the same reason).
