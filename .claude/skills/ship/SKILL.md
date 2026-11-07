---
name: ship
description: Finish the task in the current worktree. Verify, make a signed commit, push as <type>/<slug> to the fork, open an English PR against main, and watch CI. Merges and worktree removal happen only when the user asks.
argument-hint: "[optional notes for the PR description]"
disable-model-invocation: true
---

# ship

Ship the current worktree's change. Notes from the user: **$ARGUMENTS**

Rules: `.claude/rules/workflow.md` (Verify, Scope, Worktrees, Git, Privacy). Run each command plainly and separately; this is a worktree-isolated session.

## Steps

1. **In a worktree.**
   - `git rev-parse --path-format=absolute --git-dir` must differ from `--git-common-dir`. If they're equal, stop: this skill only ships from a worktree.
   - Work out `<type>` and `<slug>` from the worktree name (`<type>-<slug>`), or ask the user.
2. **Verify, and report the real output:**
   - `npm run typecheck` and `npm test`. All three baseline bodies must match. A body mismatch means stop and investigate; never regenerate fixtures.
   - `npm run build` if anything under `app/`, `components/` or `next.config.*` changed. Afterwards `git status` must show no change to `next-env.d.ts` or `tsconfig.json`; if it does, CI's clean-tree step will fail too (see CLAUDE.md).
   - If `lib/ziwei/` changed, run the `chart-diff-reviewer` agent and include what changed.
   - For UI changes, say whether you looked at the page in a browser.
3. **Review the diff.**
   - Look at `git status --short` and `git diff`.
   - Exclude the `next dev` edit to `next-env.d.ts`, `.env*` files, secrets and any real person's birth data.
   - It must be one change; split anything unrelated out and mention it.
4. **Commit.**
   - Stage explicit paths, not `git add -A`.
   - Commits are signed automatically (repo-local `commit.gpgsign`). Check with `git log --format='%G? %s' -1`: it must show `G`.
   - Write an **English** Conventional Commits message. Chart identifiers such as 四化 or 大限 may stay in Chinese.
   - End the message with the commit attribution lines this session uses.
5. **Push:** `git push -u origin HEAD:<type>/<slug>`. `origin` is the fork.
6. **Open the PR:** `gh pr create --repo thangnc/ziwei-doushu --base main --head <type>/<slug>`.
   - `--repo` is required; without it `gh` targets the upstream repo.
   - The title is the commit subject. Write the body in English:
     - what changed and why
     - the verification results with real numbers
     - anything deliberately left out
     - the user's notes, if any
   - End the body with the PR attribution lines this session uses.
7. **Watch CI** until the runs for the head commit complete. Report each job.
   - First wait until `gh run list --repo thangnc/ziwei-doushu --commit <full sha>` lists a run; `gh pr checks --watch` exits early with "no checks reported" if it starts too soon.
   - Workflows:
     - **CI** has four jobs, all in the Node 24 container: Repository guards, Typecheck, Chart regression, and Build and smoke test. They're summed up by **CI result**, which must pass before merging.
     - **Security**: Dependency review (PRs only) and npm audit (production).
     - **CodeQL**: actions and javascript-typescript.
     - **PR title**: Conventional Commits.
   - Report every job; all of them should be green before merging.
   - On a failure, read the failed log (`gh run view <id> --repo thangnc/ziwei-doushu --log-failed`) and fix it in this worktree.
8. **Stop and report.** Give the PR link and the CI result.
   - Don't merge unless the user asks.
   - When they do: `gh pr merge <n> --repo thangnc/ziwei-doushu --merge --match-head-commit <full sha>`. Use a merge commit, never squash or rebase.
   - After the merge, and only when asked:
     - `ExitWorktree` with `action: remove`
       - It warns that it will discard the merged commit because local `main` is behind. First run `git fetch origin main` and `git merge-base --is-ancestor <sha> origin/main`; if the commit is on `main` and `git status` is clean, pass `discard_changes: true`.
     - delete the remote branch
     - `git pull` in the main checkout
