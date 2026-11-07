---
paths:
  - "lib/ziwei/**"
---

# Engine rules (`lib/ziwei/`)

The engine is what this repo exists for. Every change to it can silently change thousands of charts.

## Before changing anything

- **Measure, don't reason.** Run the `chart` skill on the inputs the change affects, both before and after the change. Before you call the change done, use the `chart-diff-reviewer` agent, or diff the output of `chart.ts --sweep`.
- **Any change to chart output needs evidence**: a passage from 《紫微斗数全书》/《全集》/《骨髓赋》, a 《天纪》 time code, or a reference chart from other charting software. If the user can't supply one, stop and ask. Don't "fix" a chart from memory of how charting works.
- **Points where schools differ are options, not fixes.** Supporting-star brightness, leap-month assignment, the late-子时 day change, 天马, 截空, 魁钺, 庚年四化 and 长生 differ between schools. Add or extend an option in `school-config.ts` / `generateChart` `opts`; don't overwrite the default. Change a default only on an explicit decision, and record it in a comment.

## Invariants

- `generateChart` validates **before** calling iztro, because iztro silently "repairs" bad input. Keep the `RangeError` for each of these:
  - an `hour` that isn't an integer from 0 to 11
  - a `gender` other than exactly `'male'`/`'female'`
  - a Gregorian date that doesn't exist
  - an unknown leap-month policy

  Apply the same reject-don't-coerce approach to any new input.
- `BirthInfo.hour` is a 时辰 index (子=0 … 亥=11) and `year/month/day` is the **charting day**. True solar time and the late-子时 day change are applied in `share.ts` (`formToBirthInfo`), never inside `generateChart`. Branch and day change must follow the same time source (true solar time when a longitude is given).
- The year changes at 正月初一, not at 立春.
- `Palace[]` is indexed by earthly branch, 0 = 子. iztro's palace arrays are indexed from 寅; convert explicitly and say so in a comment.
- iztro zh-CN names: only `命宫` has 「宫」, and 交友 is `仆役`. Match names exactly; never use substring matching on palace names.
- A 四化 is `star.siHua` on the star itself. There is no star named 「化禄」 and the like.
- The natal 四化 are fixed. The 飞星 tools in `sihua.ts` are exported for display, and they are deliberately **not** used while building the chart (《天纪 03》). Don't wire them into `generateChart` or `patterns.ts`.
- Brightness school is module-global state (`setBrightnessSchool`). Any code that changes it must restore it; tests that switch schools must reset to `'default'`.
- Output must be deterministic: no `Date.now()`, randomness or locale-dependent formatting inside chart construction. `currentAge`/`isCurrentDaXian` are the only date-dependent fields, and they're isolated.

## Files

- `school-tables.generated.ts` is generated (勿手改); a hook blocks edits. Its generator isn't in this repo, so ask the user.
- `patterns.ts` and `famous.ts` import `server-only`. Don't add `server-only` to modules the browser engine needs: `algorithm.ts`, `share.ts`, `sihua.ts`, `true-solar-time.ts`, `types.ts`, `constants.ts`, `school-*`.
- `db-analysis.ts` is a deliberate open-source placeholder (`STAR_DB` is empty). Don't fill it with invented interpretation text.

## Comments

Write new comments in English; existing Chinese comments stay unless translating them is the task. A correction to engine behaviour gets a dated note that names its source, e.g.
`// ★ 2026-11-07 fix: <what changed> (source: 《全书》<passage> / <n> reference charts)`
Keep chart identifiers (star and palace names, 四化, 大限) in Chinese inside the English text.
Explain *why* and *on what authority*; the code already shows *what*.
