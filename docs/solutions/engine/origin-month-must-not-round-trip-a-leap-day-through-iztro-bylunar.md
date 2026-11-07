---
title: "Under origin-month, chart the birth date directly with bySolar; round-tripping a leap-month day through iztro byLunar crashes on day 30"
date: 2026-11-07
category: engine
module: lib/ziwei/algorithm.ts
problem_type: bug
severity: medium
tags: [leap-month, origin-month, iztro, lunar-lite, byLunar, bySolar]
related: ["docs/decisions/localization.md D-8", "scripts/regression/leap-origin-month-thirtieth-day.test.ts"]
---

## Problem

`generateChart(birthInfo, { leapMonth: 'origin-month' })` threw for 2017-08-21 (农历 2017 闰六月三十), for every hour, gender and brightness school:

```
Error: only 29 days in lunar year 2017 month 6
    at Lunar.fromYmdHms (lunar-typescript/dist/index.cjs)
    at lunar2solar (lunar-lite/lib/convertor.js:69)
    at Object.byLunar (iztro/lib/astro/astro.js:235)
    at generateChart (lib/ziwei/algorithm.ts:489)
```

The Phase 0 terminology sweep hit it as 96 failed charts (`docs/audits/terminology-audit.md` §2.6). The other three leap policies chart the date normally.

## Root cause

For a leap-month birth under any policy except `split`, the engine called `astro.byLunar(<effective lunar date>, …, isLeapMonth, fixLeap=false)`. iztro passes the date to `lunar-lite` 0.2.8 `lunar2solar`, which first calls `Lunar.fromYmd(year, month, day)` with the **regular** month, and only afterwards switches to the leap month (`0 - month`). When the leap month has 30 days and the regular month has 29, day 30 doesn't exist in the regular month, so the first call throws before the switch.

Under `origin-month` this conversion was pointless: the effective lunar date is the birth's own leap-month date, so `lunar2solar` only converts it back to the solar date the engine started from, then iztro runs `bySolar(…, fixLeap=false)`.

A sweep of 1900–2100 found **17** such dates, each day 30 of a 30-day leap month whose regular month has 29 days: 1906-06-21, 1914-07-22, 1919-09-23, 1925-06-20, 1936-05-20, 1938-09-23, 1941-08-22, 1944-06-20, 1952-07-21, 1955-05-21, 2017-08-21, 2036-08-21, 2047-07-22, 2050-05-20, 2055-08-22, 2058-06-20, 2093-08-21.

## Solution

Under `origin-month` with a leap-month birth, `generateChart` now calls `astro.bySolar(<birth date>, hour, gender, fixLeap=false)` directly. That is the policy's own definition in `lib/ziwei/school-config.ts` ("不调整（闰四月仍标闰月，iztro fixLeap=false）"). `next-month` and `prev-month` really do move the date into a regular month, so they keep `byLunar`.

Evidence that nothing else changed:
- On every other leap-month day 1900–2100 (2,149 days × hours 0/6 × both genders = 8,596 charts), iztro's `byLunar` round trip and `bySolar(fixLeap=false)` return identical astrolabes.
- `generateChart` before and after the fix, compared as full serialized charts on every leap-month day 1900–2100 (2,166 days), differs only on the 17 dates that used to throw:
  - `origin-month` at hours 0/3/6/9 × both genders: 17,192 identical, 136 previously threw and now chart, 0 changed, 0 new errors;
  - `prev-month`, `next-month` and `split` at hour 6 × both genders: 4,332 identical each, 0 changed.
- The three baseline fixture bodies are byte-identical.

## Prevention

- `scripts/regression/leap-origin-month-thirtieth-day.test.ts` charts all 17 dates × 12 hours × 2 genders under `origin-month`. It re-checks each date's month lengths with lunar-javascript and compares the chart's palaces and 14 major stars with iztro `bySolar(fixLeap=false)` called directly. It failed before the fix ("1906-6-21 hour 0 male: origin-month threw …").
- When a policy keeps the birth's own date, don't convert solar → lunar → solar through a dependency; call the solar entry point. Round trips through lunar libraries are where invalid intermediate dates appear.
- If iztro or lunar-lite is upgraded, rerun this test; the upstream `lunar2solar` ordering is still there in lunar-lite 0.2.8.

## Related

- `docs/decisions/localization.md` D-8 (the decision to fix this in an isolated PR).
- `docs/audits/terminology-audit.md` §2.6 (the original finding).
- `scripts/regression/leap-policy-validation.test.ts` (policy validation and the four-policy oracle).
