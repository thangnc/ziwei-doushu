# Localization decisions log

Decisions made on the Vietnamese localization, with dates. **They bind later phases.** Plan: Phase 0 (audits), Phase 1 (i18n core), then later phases, each started only after its own approval.

## 2026-11-07: Phase 0 accepted and closed

Phase 0 deliverables:
- `lib/i18n/TERMINOLOGY_AUDIT.md`
- `lib/i18n/UI_INVENTORY.md`
- `lib/ziwei/TIME_MODEL.md`
- `lib/ziwei/ENGINE_PROTECTION.md`
- `scripts/regression/fixtures/` (baselines, canonical container, CI verification)

### D-1 Terminology
- The 26 **Disputed** identifiers get no forced translations. Engine identifiers stay unique and unchanged, and display terms for unresolved items are deferred.
- The 196 **Verified** entries are **provisionally** accepted as *terminology attestations* only. They don't validate any calculation rule. Their cited sources (page references to archive.org scans) still need checking before the terminology is finally approved.

### D-2 Vietnamese solar mode
- The default is **mean solar time**, with **no equation of time**.
- Use the **correct historical civil offset for the location**. Never reuse China's fixed UTC+8 assumption for Vietnam.
- Correct the README's description of current behaviour: the form path uses longitude only, without the equation of time. Done in Phase 1; see below.

### D-3 Historical timezones
- Use only mappings supported by evidence. Periods that can't be resolved stay **explicitly unresolved**.
- Never silently substitute a proxy timezone.
- Keep the **exact IANA ID the user entered**, e.g. `Asia/Ho_Chi_Minh`. ICU's `resolvedOptions()` canonicalises it to `Asia/Saigon`, so don't take the ID from there.

### D-4 Unused components
No bulk deletion. Keep the inventory (`UI_INVENTORY.md` §5) and decide keep / wire in / delete **per component**, in the UI phase concerned.

### D-5 Privacy
- Approved: a **POST / server action** for normal chart generation.
- Share URLs are created **only through an explicit Share action**.
- `Referrer-Policy: no-referrer`.
- No birth information in logs, analytics or error monitoring.

### D-6 Calculation precision
- Keep full precision internally, and **round once**, when the final corrected time is converted into engine input.
- The rounding is **deterministic nearest-minute, half-up**, with boundary regression tests.
- **No China DST control in the UI yet.**

### D-7 Node 26
No extra CI job for now. **Node 22.22.3** stays the canonical runtime (see `scripts/regression/fixtures/README.md`).

**Superseded 2026-11-07:** the canonical runtime is now **Node 24.22.2** (pinned container), and CI runs only on it. The three baseline bodies were byte-identical when regenerated there. See `scripts/regression/fixtures/README.md`.

### D-8 Leap-month bug
`generateChart` throws for 2017-08-21 (闰六月三十) under `origin-month`: "only 29 days in lunar year 2017 month 6". It gets a **separate issue and an isolated bugfix PR**, with a regression test and a check that unrelated baseline output is unchanged. It is **not** mixed with localization work.

Status: the issue and PR have **not been created yet**. Filing on GitHub is an outward-facing action, so it waits for confirmation of the target repository.

## 2026-11-07: Phase 1 (i18n core) started

Scope:
- `zh`/`vi` message system, with Vietnamese as the default and Chinese kept
- locale resolved from a cookie
- `LocaleProvider` and a language switcher
- correct `<html lang>` and metadata
- fonts
- the SEO limitation documented

Out of scope: Phase 2 (localizing chart terms and UI), timezone work, engine refactoring and the move of pattern detection.
