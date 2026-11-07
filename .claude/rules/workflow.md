# Workflow rules (always apply)

## Verify before claiming done

- Run `npm run typecheck` and `npm test` (the Stop hook runs the tests automatically when engine files change), and report the actual result. If something fails, show the output. Don't describe a change as working when it has only been written.
- If chart output changed, state what changed (from the `chart-diff-reviewer` agent or a sweep diff), and that the change was intended.
- If the change is in the UI, say whether you looked at it in the browser. If you didn't, say so.

## Scope

- One change per task and per PR, as CONTRIBUTING.md asks. Don't bundle refactors, reformatting or "while I'm here" fixes into a bug fix; mention them instead.
- There is no linter or formatter. Match the surrounding style by hand: 2-space indent, single quotes, semicolons, and the existing Chinese comment style. Don't reformat lines you didn't change.
- Don't add dependencies without asking. The project deliberately cut its dependencies from 483 to 185. Prefer the Node standard library and the existing packages (iztro, lunar-javascript).

## Worktrees

- **Implementation and bug fixes always happen in a git worktree, never in the main checkout.**
  - Start with `/start-work <type> <slug>`, or call `EnterWorktree` / run `claude -w <name>`.
  - The `require-worktree` hook blocks Edit/Write/NotebookEdit on files in the main checkout.
  - Questions, reviews, read-only investigation and running the `chart` skill don't need a worktree.
- **Base and branch:**
  - Worktrees branch from `origin/main`. `origin` is the fork `thangnc/ziwei-doushu`; `upstream` is Renhuai123.
  - The local branch is `worktree-<name>`. Push it under the conventional name: `git push -u origin HEAD:<type>/<slug>`.
- **One task per worktree.** Finish with `/ship`. Remove the worktree (`ExitWorktree` with `remove`) only after its PR is merged or the user abandons it.
- **Dependencies:** each worktree needs its own `npm ci`; never symlink or share `node_modules` between worktrees.
  - Dependency changes would corrupt a shared folder.
  - `.worktreeinclude` isn't used, because the open-source app needs no gitignored files (`.env.local`) to run.
- **Dev server:** use a different port from the main checkout, e.g. `npm run dev -- -p 3100`.
- **Isolated sessions only accept plain commands.** Claude Code refuses commands it can't prove stay inside the worktree:
  - sourcing scripts, e.g. `. ~/.nvm/nvm.sh`
  - computed `PATH=…` prefixes
  - long compound pipelines

  Run binaries directly (`npm test`, `node_modules/.bin/tsc`) as separate commands. They use the shell's default Node; CI's pinned Node 24.22.2 container stays the reference for the baselines.
- **Hooks resolve paths per checkout.** `$CLAUDE_PROJECT_DIR` stays at the main checkout inside a worktree session, so hooks use the edited file's git root or the session `cwd` (`.claude/hooks/lib.sh`). Keep it that way in new hooks.
- **Escape hatch:** if the user explicitly wants an edit made in the main checkout, they create the gitignored marker `.claude/allow-main-edits` there and delete it afterwards. Never create it yourself.

## Git

- Commit messages follow the repo's Conventional Commits style.
  - In upstream (Renhuai123/ziwei-doushu) the scope may be Chinese or English and the subject is usually Chinese, e.g.
    `fix(引擎): 闰月归属 policy 非法值当场拒绝，不再静默按「归本月」排盘`
    `feat(engine): …` · `docs(README): …` · `fix(share): …`
  - **On the fork `thangnc/ziwei-doushu`, commit messages, PR titles and PR descriptions are in English** (the owner's choice). Chart terms that are engine identifiers (四化, 大限, 时辰) may stay in Chinese.
  - Add `(#issue)` when there is one.
- Commits are SSH-signed (repo-local `commit.gpgsign`). The fork's `main` ruleset requires signed commits, passing checks and a PR. Merge PRs with a merge commit, never squash or rebase.
- Run `gh` with `--repo thangnc/ziwei-doushu`; otherwise it targets the upstream repo, because the fork has a parent.
- `next dev` rewrites `next-env.d.ts` and `tsconfig.json`. Don't stage those generated edits unless the task is about them.
- Commit, push or open a PR only when the user asks. Never commit `.env.local`, keys or real people's birth data.

## Privacy

- Treat birth data (date, time, place, name) as personal data. In tests, docs, issues and examples, use synthetic inputs or the published samples in `famous.ts`. Don't copy a user's or issue reporter's birth data into the repo.

## When unsure

- If a question depends on doctrine or which school to follow (亮度, 闰月, 晚子时, 四化 variants), lay out the options and their sources and let the user decide. Don't pick one silently.
