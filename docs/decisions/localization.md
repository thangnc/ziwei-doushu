# Localization decisions log

Decisions made on the Vietnamese localization, with dates. **They bind later phases.** Plan: Phase 0 (audits), Phase 1 (i18n core), then later phases, each started only after its own approval.

## 2026-11-07: Phase 0 accepted and closed

Phase 0 deliverables:
- `docs/audits/terminology-audit.md`
- `docs/audits/ui-inventory.md`
- `docs/architecture/time-model.md`
- `docs/architecture/engine-protection.md`
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
No bulk deletion. Keep the inventory (`docs/audits/ui-inventory.md` §5) and decide keep / wire in / delete **per component**, in the UI phase concerned.

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

**Fixed 2026-11-07** in an isolated bugfix PR, as decided above. Under `origin-month`, `generateChart` now charts a leap-month birth with `astro.bySolar(…, fixLeap=false)` instead of round-tripping the date through `astro.byLunar`. The crash affected 17 dates in 1900–2100, not only 2017-08-21. Root cause, evidence and prevention: `docs/solutions/engine/origin-month-must-not-round-trip-a-leap-day-through-iztro-bylunar.md`. Regression test: `scripts/regression/leap-origin-month-thirtieth-day.test.ts`. The baseline bodies are unchanged. No separate issue was filed (owner's decision, 2026-11-07): the PR and the solution doc are the record.

## 2026-11-07: Phase 1 (i18n core) started

Scope:
- `zh`/`vi` message system, with Vietnamese as the default and Chinese kept
- locale resolved from a cookie
- `LocaleProvider` and a language switcher
- correct `<html lang>` and metadata
- fonts
- the SEO limitation documented

Out of scope: Phase 2 (localizing chart terms and UI), timezone work, engine refactoring and the move of pattern detection.

## 2026-11-08: Phase 2 (chart terms and chart UI) started

Scope: the chart-term presenter (`apps/web/lib/i18n/terms.ts`, data in `terms-data.ts`), then the chart UI on `/chart` (`ChartBoard`, `PalaceCell`, `TimeNav`, `BirthForm`, `InsightPanel`), with the tests `i18n-terms-coverage` and `vi-presentation-baseline`.

Out of scope: Phase 3 (birth time, Vietnamese locations), Phase 4 (pattern detection on the server), Phase 5 (AI output), and the rest of the UI (Phase 6).

### D-9 Display of chart terms while the audit is open
Decided by the owner on 2026-11-08, when Phase 2 started. It refines D-1 for display; D-1 still holds for the engine.
- **Verified** terms are used now, provisionally, as D-1 allows. Their archive.org citations are not re-checked first.
- **Disputed and Unverified** terms are shown as the audit's **Hán-Việt reading** (its "Hán-Việt reading" column), not as either side of a dispute. The UI marks them as provisional: a dotted underline, and a tooltip with the Chinese identifier and the audit status. This is not a forced translation: no variant is chosen, and each term can be settled later in one place.
- **Mechanical rule** for turning an audit cell into a display term: unwrap a one-word parenthetical that completes the name ("Thiên Mã Tại Thiên (Di)" → "Thiên Mã Tại Thiên Di"), drop every other parenthetical, and use the first of "A / B" variants ("Lực Sĩ / Lực Sỹ" → "Lực Sĩ").
- **Coverage:** every audit row that is runtime-observed or declared-but-not-observed gets a term. iztro-only and proven-unreachable rows don't.
- **Settling a term later:** record a decision here (e.g. "D-10 咸池 shows as Đào Hoa"), change the entry in `terms-data.ts` and list it in `DECIDED_TERMS` with the decision ID. `i18n-terms-coverage` then accepts the new term and stops marking it provisional; regenerate the `vi-presentation-baseline` fixture and review its diff.

Consequences worth a decision soon, because the Hán-Việt reading is known to mislead (audit §5.17):
- 本命 → "Bản Mệnh" already means the nạp-âm element in Vietnamese Tử Vi (TTL p.5 §2).
- 副截 → "Phó Tiệt" next to 截空 → "Triệt" (§5.4; the tradition writes Triệt, not Tiệt).
- 闲 / 不 / 利 → "Nhàn" / "Bất" / "Lợi" have no Vietnamese grade (§5.5, §5.10).
