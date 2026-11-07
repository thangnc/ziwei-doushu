---
title: "Claude Code hooks must resolve the edited file's own checkout, because CLAUDE_PROJECT_DIR stays at the main checkout inside a worktree"
date: 2026-11-07
category: workflow
module: .claude/hooks/
problem_type: bug
severity: high
tags: [claude-code, hooks, worktree, protect-files, typecheck]
related: ["PR #6", ".claude/hooks/lib.sh"]
---

## Problem

Once implementation work moved into git worktrees (`.claude/worktrees/<name>`), the project hooks checked the wrong files:
- `protect-files.sh` let edits to a worktree's `package-lock.json`, `.env*` and generated files through (the old script exited 0 for a worktree `package-lock.json`).
- `typecheck.sh` and `regression-on-stop.sh` ran `tsc` / `npm test` in the main checkout instead of the worktree that was edited.

## Root cause

Inside a worktree session `$CLAUDE_PROJECT_DIR` still points at the main checkout, while the hook input's `cwd` and `tool_input.file_path` point into the worktree. The hooks computed repo-relative paths against `$CLAUDE_PROJECT_DIR`, so a worktree path never matched the protected-file patterns, and the checks ran against the wrong tree.

## Solution

A shared, sourced helper `.claude/hooks/lib.sh`:
- `repo_root_for <file>`: `git -C <nearest existing dir> rev-parse --show-toplevel`, the checkout that actually contains the file.
- `session_root <cwd>`: the git root of the hook input's `cwd`, falling back to `$CLAUDE_PROJECT_DIR`.

`protect-files.sh` and `typecheck.sh` use `repo_root_for`; `regression-on-stop.sh` uses `session_root`. `protect-files.sh` also tolerates files outside any repo (`|| true`, since it runs under `set -e`).

## Prevention

- `.claude/rules/workflow.md` → Worktrees: "Hooks resolve paths per checkout … Keep it that way in new hooks."
- When adding a hook, pipe-test it with a worktree path as well as a main-checkout path (PR #6 ran 18 such pipe tests).
- Hook scripts run from the main checkout, so a hook change only takes effect after it's merged and the main checkout is pulled.

## Related

- PR #6 (`chore(claude): work in git worktrees; make hooks worktree-aware`).
- `.claude/hooks/require-worktree.sh` (blocks edits in the main checkout; added in the same PR).
