---
name: start-work
description: Start an implementation or bug-fix task in a fresh git worktree branched from the fork's main, with its own npm install. Use at the start of every change to code, tests or docs.
argument-hint: "<type> <slug>   e.g. fix leap-origin-month · feat vi-terms-presenter · docs readme-time"
disable-model-invocation: true
---

# start-work

Start a task in a new worktree for: **$ARGUMENTS**

The arguments are `<type> <slug>`:
- `type` is a Conventional Commits type: `fix`, `feat`, `docs`, `test`, `chore`, `ci` or `refactor`.
- `slug` is kebab-case, at most 40 characters.

If either is missing or unclear, ask for it before creating anything.

Rules: `.claude/rules/workflow.md` → Worktrees. In a worktree session, run each command plainly and separately. Don't source scripts or use `PATH=…` prefixes; Claude Code refuses commands it can't verify.

## Steps

1. **Not already in a worktree.**
   - Run `git rev-parse --path-format=absolute --git-dir` and `git rev-parse --path-format=absolute --git-common-dir`.
   - If they differ, this session is already in a worktree. Stop and ask whether to finish that task first (`/ship`) or switch.
2. **Base is current.**
   - Run `git fetch origin main`.
   - `origin` must be `thangnc/ziwei-doushu` (`git remote get-url origin`). If it isn't, stop and report it.
3. **Create the worktree:** call `EnterWorktree` with `name` = `<type>-<slug>`.
   - It branches from `origin/main` (setting `worktree.baseRef` = fresh) on local branch `worktree-<type>-<slug>`.
   - Confirm that `git log --oneline -1` matches `git log --oneline -1 origin/main`.
4. **Install:** `npm ci --no-audit --no-fund`.
   - Each worktree has its own `node_modules`; never symlink one from the main checkout.
   - An `EBADENGINE` warning when the shell's Node isn't 22.22.3 is expected.
5. **Baseline check:** `npm run typecheck`. Report a failure at this point as pre-existing, not as caused by the task.
6. **Report to the user, briefly:**
   - the worktree path
   - the local branch, and the branch it will be pushed as (`<type>/<slug>`)
   - the base commit
   - for UI work: run the dev server on a separate port with `npm run dev -- -p 3100`
   - finish with `/ship` when done

Then start the task itself. Keep to one change, per the Scope rules.
