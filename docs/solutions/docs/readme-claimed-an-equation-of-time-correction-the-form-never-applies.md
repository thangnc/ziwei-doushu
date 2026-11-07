---
title: "Describe what the reachable code path does: the chart form applies a longitude correction only, never the equation of time"
date: 2026-11-07
category: docs
module: lib/ziwei/share.ts
problem_type: docs
severity: medium
tags: [readme, true-solar-time, equation-of-time, longitude, docs-accuracy]
related: ["PR #2", "docs/architecture/time-model.md"]
---

## Problem

The README's engine feature table described 真太阳时校正 as "按出生地经度算时差 + 均时差" (longitude offset plus the equation of time). Charts generated through the form never include an equation-of-time term.

## Root cause

The docs described the library, not the path users reach.
- The form path computes the offset as `(longitude - 120) * 4` minutes against a fixed UTC+8 meridian, i.e. local mean solar time: `lib/ziwei/share.ts:8` and `:30`, and the same formula in `components/BirthForm.tsx:83`.
- `calculateTrueSolarTime` (`lib/ziwei/true-solar-time.ts:103`) does add the equation of time, but nothing on the form path calls it.

## Solution

Commit `32c3653` corrected the README (Chinese and English) to say the form applies a longitude correction only (UTC+8, (longitude − 120°) × 4 minutes, local mean solar time) and doesn't add the equation of time, with a dated 2026-11-07 note. Documentation only; chart results didn't change.

## Prevention

- Before stating what the engine does in a README or doc, trace the call path from the UI entry point (`formToBirthInfo` in `lib/ziwei/share.ts`), not from what a library function can do.
- The `birthtime-baseline` fixture pins the form's actual behaviour, so a code change that silently adds the equation of time fails `npm test`.
- Any future change to `'true'` solar mode is a chart-output change and needs its own evidence and PR (`docs/decisions/localization.md` D-2).

## Related

- `docs/architecture/time-model.md` §1.4 (the original finding). Its second item, the README's China DST range "1986–1991" versus `dst-cn.ts` covering 1935–1991, is still open.
- `docs/decisions/localization.md` D-2 (Vietnamese solar mode).
