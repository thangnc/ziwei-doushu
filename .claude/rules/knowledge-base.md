---
paths:
  - "docs/solutions/**"
  - "docs/architecture/**"
  - "docs/decisions/**"
  - "docs/audits/**"
  - "docs/README.md"
---

# Knowledge-base rules (`docs/`)

`docs/` holds the engineering record: `architecture/` (how things work and the specs they follow), `decisions/` (decision logs), `audits/` (point-in-time audits) and `solutions/` (one lesson per file). `docs/tianji-ziwei/` is the synced 倪师 corpus and is read-only; `content-and-licensing.md` covers it.

## Rules

- **Solution docs follow `docs/solutions/README.md`.** Frontmatter keys, categories and required sections are checked in CI by `.github/scripts/check-repo-guards.mjs`; a new category needs the README table and `CATEGORIES` in that script updated together.
- **Title with the lesson, not the symptom**, and keep one lesson per file. Search `docs/solutions/` first and update an existing doc rather than adding a near-duplicate.
- **Only verified facts.** Quote real error text, commands, `file:line` references and PR or issue numbers. Never invent evidence or reconstruct it from memory; if a fact can't be checked, leave it out or say it's unverified.
- **Don't rewrite history.** Decision logs, audits and solution docs are records. When something changes, add a dated note (`**Superseded YYYY-MM-DD:** …`, as in `docs/decisions/localization.md` D-7) and keep the original text. Audits keep their original headings and line numbers; note when those are historical.
- **Back-links.** When a regression test or code comment exists because of a lesson, it cites the solution doc's path, and the doc's `## Related` names the test.
- **Links.** Use relative links that resolve from the file's own folder, and check them after moving files.
- Write in English. Chart identifiers (四化, 大限, 时辰, star and palace names) stay in Chinese.

## Verify

```bash
node .github/scripts/check-repo-guards.mjs   # knowledge-base format (check 3)
```
