---
title: "On this fork, gh targets the upstream repo by default, Actions must be allowed explicitly, and main requires signed commits"
date: 2026-11-07
category: workflow
module: GitHub repository settings (thangnc/ziwei-doushu)
problem_type: workflow
severity: medium
tags: [github, fork, gh, actions, signing, ruleset]
related: ["PRs #1-#5"]
---

## Problem

Getting the first stacked PRs (#1–#5) reviewed and merged on the fork `thangnc/ziwei-doushu` hit four separate problems:
1. `gh pr …` commands acted on the upstream repo `Renhuai123/ziwei-doushu` instead of the fork.
2. CI never ran on the fork's PRs.
3. PRs with passing CI still couldn't merge: "Commits must have verified signatures."
4. `gh pr merge --match-head-commit <short sha>` failed.

## Root cause

1. A fork has a parent, and `gh` resolves the base repository to the parent by default.
2. The fork's Actions permissions were `local_only`, which blocks `actions/checkout`, so no workflow could run. Allowing GitHub-owned actions through the API also switched on `sha_pinning_required`.
3. The fork's `main` ruleset requires signed commits, and the commits weren't signed.
4. `--match-head-commit` compares against the full 40-character SHA.

## Solution

1. Always pass `--repo thangnc/ziwei-doushu` to `gh`.
2. Set the Actions permissions to `allowed_actions=selected` with `github_owned_allowed=true`, and reset `sha_pinning_required` to false at the time. Workflows have since pinned every action to a commit SHA.
3. Sign commits with an SSH key, configured repo-locally (`gpg.format=ssh`, `user.signingkey`, `commit.gpgsign=true`), register the key on GitHub as a signing key, and re-sign the branch. Check with `git log --format='%G? %s' -1` (must show `G`). Merge with a merge commit, which GitHub signs.
4. Pass the full SHA: `git rev-parse HEAD`.

## Prevention

- `.claude/rules/workflow.md` → Git records `--repo`, signing, and merge commits only; the `/ship` skill uses all of them.
- The ruleset's status-check rule names no checks, so GitHub doesn't enforce CI passing; `/ship` waits for CI before a merge is proposed.
- Retarget a stacked PR to `main` before merging it; the fork has `delete_branch_on_merge=false`, so delete merged branches explicitly.

## Related

- PRs #1–#5 (the first stacked series on the fork).
- `.claude/skills/ship/SKILL.md`.
