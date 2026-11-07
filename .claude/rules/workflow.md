# Workflow rules (always apply)

## Verify before claiming done

- Run `npm run typecheck` and `npm test` (the Stop hook runs the tests automatically when engine files change), and report the actual result. If something fails, show the output. Don't describe a change as working when it has only been written.
- If chart output changed, state what changed (from the `chart-diff-reviewer` agent or a sweep diff), and that the change was intended.
- If the change is in the UI, say whether you looked at it in the browser. If you didn't, say so.

## Scope

- One change per task and per PR, as CONTRIBUTING.md asks. Don't bundle refactors, reformatting or "while I'm here" fixes into a bug fix; mention them instead.
- There is no linter or formatter. Match the surrounding style by hand: 2-space indent, single quotes, semicolons, and the existing Chinese comment style. Don't reformat lines you didn't change.
- Don't add dependencies without asking. The project deliberately cut its dependencies from 483 to 185. Prefer the Node standard library and the existing packages (iztro, lunar-javascript).

## Git

- Commit messages follow the repo's Conventional Commits style. The scope may be Chinese or English and the subject is usually Chinese, e.g.
  `fix(引擎): 闰月归属 policy 非法值当场拒绝，不再静默按「归本月」排盘`
  `feat(engine): …` · `docs(README): …` · `fix(share): …`
  Add `(#issue)` when there is one.
- `next dev` rewrites `next-env.d.ts` and `tsconfig.json`. Don't stage those generated edits unless the task is about them.
- Commit, push or open a PR only when the user asks. Never commit `.env.local`, keys or real people's birth data.

## Privacy

- Treat birth data (date, time, place, name) as personal data. In tests, docs, issues and examples, use synthetic inputs or the published samples in `famous.ts`. Don't copy a user's or issue reporter's birth data into the repo.

## When unsure

- If a question depends on doctrine or which school to follow (亮度, 闰月, 晚子时, 四化 variants), lay out the options and their sources and let the user decide. Don't pick one silently.
