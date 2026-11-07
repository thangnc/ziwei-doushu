# docs

Engineering records for this repo, plus the synced 倪师 corpus. Nothing here is published as a website.

| Folder | What it holds |
|---|---|
| [`architecture/`](./architecture/) | How the engine works and the specs it should follow: [`time-model.md`](./architecture/time-model.md) (birth-time resolution, true solar time, historical timezones) and [`engine-protection.md`](./architecture/engine-protection.md) (dependency graph, client bundle, privacy threat model). |
| [`decisions/`](./decisions/) | Decision logs. [`localization.md`](./decisions/localization.md) records the Vietnamese-localization decisions D-1 to D-8. |
| [`audits/`](./audits/) | Point-in-time audits: [`terminology-audit.md`](./audits/terminology-audit.md) (engine identifiers → Vietnamese terms) and [`ui-inventory.md`](./audits/ui-inventory.md) (routes, components, known UI findings). |
| [`solutions/`](./solutions/) | Lessons already paid for, one per file: problem, root cause, solution, prevention. Search it before changing an area; add to it with `/record-solution`. Format: [`solutions/README.md`](./solutions/README.md), checked in CI. |
| [`tianji-ziwei/`](./tianji-ziwei/) | 1848 quoted lines from 倪海厦《天纪》, synced from the `nihai-tianji-corpus` repo and licensed CC BY-NC-SA 4.0. **Read-only here**: corrections go upstream, and a hook blocks edits. |

Docs that describe one folder stay beside it: [`lib/i18n/README.md`](../lib/i18n/README.md) (how the i18n layer works) and [`scripts/regression/fixtures/README.md`](../scripts/regression/fixtures/README.md) (baseline fixtures and the canonical Node container).

`architecture/`, `decisions/` and `audits/` were moved here from `lib/ziwei/` and `lib/i18n/` on 2026-11-07. Their content is unchanged, so headings such as "TIME_MODEL" and "deliverable D3" keep their original names.
