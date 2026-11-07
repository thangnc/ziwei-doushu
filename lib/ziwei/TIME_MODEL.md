# TIME_MODEL — birth-time resolution (Phase 0, deliverable D3)

> **Status: audit and specification only.** Nothing in this document is implemented. No existing file was changed to produce it.
> Repo state audited: commit `a600484` (`main`). Line numbers refer to that commit.
> Runtime used for every probe: **Node 22.22.3** (`~/.nvm/versions/node/v22.22.3/bin/node`), `process.versions` = `{ tz: "2026a", icu: "78.2", unicode: "17.0", cldr: "48.0" }`.
> Latest tzdata release on the probe date (2026-11-07): **2026f** (released 2026-10-27, per `https://data.iana.org/time-zones/tzdb/version` and the NEWS file header).
> Probe scripts and raw outputs live in the session scratchpad and are not committed. Their outputs are quoted in full or in relevant part below.

Conventions: offsets are in **minutes east of UTC** (Vietnam today = +420, China = +480). Longitude λ is in **decimal degrees east**. "Clock" means the wall-clock reading the user entered.

---

## 1. Current state (code audit)

### 1.1 The form path: local mean time against a fixed UTC+8, no equation of time

The live chart pipeline is: `BirthForm` → `formToBirthInfo` → `generateChart`.
- `/chart`: `app/chart/page.tsx:36`
- `/heming`: `app/heming/page.tsx:100-101`
- BirthForm submits via `components/BirthForm.tsx:142`

The longitude correction is written three times. Each copy uses `(λ − 120) × 4` and none of them adds an equation of time:

| # | Location | Code | Purpose |
|---|---|---|---|
| 1 | `lib/ziwei/share.ts:6-12` (`calcTrueSolarBranch`), formula at `:8` | `const offset = (longitude - 120) * 4;` then `((clockMins + offset) % 1440 + 1440) % 1440`. The branch is computed inline at `:10-11`. | The live 时辰 preview in the form (`components/BirthForm.tsx:74-81`) |
| 2 | `lib/ziwei/share.ts:21-48` (`formToBirthInfo`), formula at `:30` | `const solar = clockH*60 + clockM + (form.longitude - 120) * 4;` normalised at `:31`, then `branchFromSolarMinutes` at `:32` and `resolveZiweiDayOffset` at `:33`, with the date shifted by `shiftGregorianDate` at `:35`. | The `BirthInfo` actually charted |
| 3 | `components/BirthForm.tsx:83` | `const offsetMin = Math.round((form.longitude - 120) * 4);` | Display only: "时差 ±N 分钟" at `components/BirthForm.tsx:324` |

Facts verified from the code:
- **No equation of time anywhere on the form path.** `share.ts` imports only `branchFromSolarMinutes`, `resolveZiweiDayOffset` and `shiftGregorianDate` from `true-solar-time.ts` (`share.ts:3`). It never imports `equationOfTimeMinutes` or `calculateTrueSolarTime`. A repo-wide grep shows `calculateTrueSolarTime` is called only from `scripts/regression/clock-adjust.test.ts:35,41`; **no route or component calls it.**
- **The offset is fixed at +480.** The 120° meridian is a literal; no timezone, DST or history is consulted. So the form computes **local mean time (LMT) against a fixed UTC+8**: `LMT = clock + 4·(λ − 120)`.
- **No rounding on the form path.** `share.ts:30-32` uses the raw float. `true-solar-time.ts:116` rounds to the nearest second (`Math.round(rawMinutes * 60)`). §2.4 covers why this matters.
- **Shared helpers.** The form path reuses the branch-boundary function (`branchFromSolarMinutes`, `true-solar-time.ts:98-101`) and the late-子 day rule (`resolveZiweiDayOffset`, `true-solar-time.ts:141-156`, default `'next-day'`). So 时辰 boundaries and the 晚子时 date shift are computed the same way in both paths; only the minute value fed into them differs.
- **"No birthplace" means λ = 120, not "no correction".** The form defaults `longitude` to 120 (`BirthForm.tsx:56`), and the city pickers fall back to 120 (`BirthForm.tsx:125,131`). The correction is then 0 because λ happens to equal the hard-coded meridian. `formToBirthInfo` stores `longitude` on `BirthInfo` only when a province is chosen (`share.ts:46`). The engine itself never reads `BirthInfo.longitude`: a grep of `algorithm.ts` for `longitude` finds nothing, and the field is only declared at `types.ts:10`.
- **Preview and submit agree.** Probe D (§1.6) compared `calcTrueSolarBranch` against `formToBirthInfo(...).hour` for all 296 distinct catalogue longitudes × 1440 clock minutes and found **0 mismatches**.
- **Year range.** The form accepts years 1900–2026 (`BirthForm.tsx:93`). This matters for Vietnam because 1900–1906 is the LMT era (§3).

### 1.2 `lib/ziwei/true-solar-time.ts` — `calculateTrueSolarTime` (`:103-138`)

- It computes `meridian = utcOffsetMinutes / 4` at `:107`, defaulting to 120. Then `longitudeCorrectionMinutes = (λ − meridian) × 4` (`:108`), and adds `equationOfTimeMinutes(...)` (`:109-111`, NOAA approximation at `:77-96`) whenever a longitude is given.
- It rounds the total to the nearest second (`:116`), derives `dayOffset` and the minute of day from that (`:117-122`), and computes `branch` (`:136`).
- Contract per its own comments (`:5-6`, `:26-27`): `utcOffsetMinutes` is "钟表时间所在时区的**标准**偏移" (the standard offset of the clock's zone). DST and historical zones are **not** handled. A DST clock reading must first be converted to standard time with `clock-adjust.ts`.
- `equationOfTimeMinutes` evaluates NOAA's fractional year γ with the **local clock date and hour** (`:86-88`). NOAA's formula is `γ = 2π/365·(day_of_year − 1 + (hour − 12)/24)` and does not say which time scale "hour" uses. NOAA's true-solar-time formula is `time_offset = eqtime + 4·longitude − 60·timezone`, where timezone is "in hours from UTC" (source: https://gml.noaa.gov/grad/solcalc/solareqns.PDF, p.1).

**Why `meridian = utcOffsetMinutes / 4` is wrong when the offset includes DST.** The arithmetic is `clock + (λ − off/4)·4 = clock − off + 4λ`. That equals `UTC + 4λ` (correct LMT) exactly when `off` is the offset the clock reading was actually in. So:
- **Pass the civil offset including DST:** the total is correct, but the decomposition is wrong. The "meridian" `off/4` is not a real standard meridian (e.g. −60° for New York in summer). The DST hour is also folded into `longitudeCorrectionMinutes`, which the function returns as a field (`:127`) and which a UI would display as the "longitude correction".
- **Pass the standard offset, as the comment instructs, but with an unconverted DST clock reading:** the result is wrong by the DST amount. Nothing in the function can detect this.
- The function has a single offset parameter that serves two roles: resolving UTC (needs the *civil* offset) and naming a meridian (a *standard*-offset concept). It is only correct if the caller keeps clock and offset consistent.

Probe (`dst-meridian.ts`, Node 22.22.3). New York, 1995-07-15, λ = −74, clock 14:00 EDT:

```
A clock 14:00 EDT, utcOffset -240 (civil, incl. DST)           lngCorr=-56.00 EoT=-5.79 -> TST 12:58:13 branch=6
B clock 13:00 (after clock-adjust -60), utcOffset -300 (std)   lngCorr=4.00 EoT=-5.79 -> TST 12:58:13 branch=6
C clock 14:00 EDT, utcOffset -300 (std) WITHOUT clock-adjust   lngCorr=4.00 EoT=-5.79 -> TST 13:58:13 branch=7
```

A and B agree on the instant, but A reports a "longitude correction" of −56 min that is really −60 (DST) + 4 (longitude). C is off by one hour and lands in a different 时辰. §2 removes this dual role: `civilOffsetMinutes` is the only offset used to resolve UTC, and the standard offset is only explanatory.

### 1.3 `lib/ziwei/clock-adjust.ts` and `lib/ziwei/dst-cn.ts`

- **`clock-adjust.ts`** (pure functions):
  - `clockToStandardDelta(actual, std) = std − actual` (`:20-22`).
  - `shiftClock` (`:25-33`) shifts an `HH:MM` reading. It returns `null` if the result crosses midnight (`:31`), so the user has to change the date. It also returns `null` for a delta of 0 or a non-integer delta (`:29`).
  - The header (`:1-15`) says it should be a user-pressed, reversible button and **never applied automatically**, because the program can't know whether the user typed a DST reading or an already-converted standard time.
- **`dst-cn.ts`** detects Chinese DST by **date only**, never by hour (`isChinaDST`, `:55-66`). It uses a copied "mainstream" table, `XLS_CN` (`:33-43`), which covers **1935–1961, 1974–1975, 1979 and 1986–1991**, not only 1986–1991.
  - The header (`:15-21`) records how it compares with IANA `Asia/Shanghai`. Start dates match for 1986, 1987, 1989, 1990 and 1991. End dates are one day later than tzdata by design, because tzdata switches at 02:00 on the end date. **1988 genuinely disagrees** (4/10 in the table, 4/17 in IANA). Before 1979 the two diverge widely.
  - The header (`:23-29`) states the policy: detection only, never automatic subtraction.
- **Wiring today:** a repo-wide grep finds **no route or component that imports `dst-cn.ts` or `clock-adjust.ts`**. Only the tests do: `scripts/regression/dst-cn.test.ts:11` and `scripts/regression/clock-adjust.test.ts:7`.
  - `dst-cn.ts:28-29` refers to `components/heming/HemingStepForm.tsx`, but that file does not exist in this repository.
  - So in this repo the form path ignores DST completely. A 1986–1991 summer clock reading is charted as if it were +480 standard time, i.e. one hour late in solar terms, unless the user corrects it themselves.

### 1.4 README mismatch (finding; not resolved here)

Exact lines in `README.md`:
- `README.md:311`: `| **真太阳时校正** | 按出生地经度算时差 + 均时差，避免东西向差一个时辰 |`
- `README.md:335`: `| \`true-solar-time.ts\` | 真太阳时校正（经度差 + 均时差） |` (the same wording appears in the changelog table at `README.md:100`)
- `README.md:312`: `| **中国夏令时** | 1986–1991 年的夏令时区间自动判定（只判定、不自动扣除；钟表读数由用户确认后用 \`clock-adjust.ts\` 换成标准时间） |`

The mismatches:
1. **均时差 (equation of time).** `README.md:311` presents "经度时差 + 均时差" as what the product does. The path users actually reach (`share.ts:8`, `:30`) applies **only** the longitude term, against a fixed 120° meridian. The module described at `README.md:335` does include EoT (`true-solar-time.ts:109-111`), but no route calls it (§1.2).
2. **夏令时 (DST).** `README.md:312` says "1986–1991", but `dst-cn.ts:33-43` covers 1935–1991. The README also implies a user-confirmation flow ("由用户确认后用 clock-adjust.ts"), which this repo does not wire into any UI (§1.3).

Per the plan these are recorded, not fixed (see §6, decision D-2).

### 1.5 What is persisted today

**localStorage `ziwei_history`** (`lib/ziwei/history.ts`):
- Key `'ziwei_history'` (`:4`), at most 10 entries (`:5`).
- Entry shape (`:7-12`): `{ id: string, label: string, form: BirthFormState, savedAt: number }`. The whole raw form is stored. Its type is defined at `BirthForm.tsx:10-22`: `name, year, month, day, clockHour, clockMinute` (all strings), `unknownTime`, `province`, `city`, `longitude: number`, `gender`.
- **Nothing describing the calculation is stored**: no timezone, offset, solar mode, tzdata version or calculation version. The longitude is the city-table value at the time of saving.
- De-duplication (`:41-48`) compares year, month, day, gender, clockHour and clockMinute. It **ignores place and longitude**, so the same birth time in two different cities overwrites the earlier entry.

**Share URL** (`lib/ziwei/share.ts`):
- `formToSearchParams` (`:51-68`) writes these parameters:
  - `n` (name, if any)
  - `y`, `m`, `d`
  - `u=1` if the time is unknown, otherwise `h` and `mi`
  - `p` (province) and `c` (city), if set
  - `lo` (longitude), **only if `form.longitude && form.longitude !== 120`** (`:65`), so 120 and 0 are never written
  - `g` (`m`/`f`)
- `searchParamsToForm` (`:71-89`) restores missing `h`/`mi` as `'8'`/`'0'` (`:82-83`) and a missing `lo` as `120` (`:86`).
- **No calculation version or timezone is carried.**

**Neither is used today.** A repo-wide grep finds no importer of `useHistory`, `formToSearchParams` or `searchParamsToForm` outside their own files. In this repository they are dormant code. Entries may still exist in a deployment that uses them (the closed-source production site); that can't be verified from this repo. The migration rules in §4.4 apply to any such data.

### 1.6 Probe: form path (mean, +480) vs `calculateTrueSolarTime` (true, +480)

Script `mean-vs-true.ts`, run with `tsx` under Node 22.22.3 against the real `share.ts`, `true-solar-time.ts` and `cities.ts`. In the output below, "form" = `formToBirthInfo`, and "TST" = `calculateTrueSolarTime({ …, utcOffsetMinutes: 480 })` + `resolveZiweiDayOffset`. Longitudes come from `lib/ziwei/cities.ts:25` (北京 116.4) and `:628` (乌鲁木齐 87.6).

```
## A. EoT (NOAA, true-solar-time.ts:77) at local noon on probe dates
1990-02-11  EoT = -14.20 min
1990-11-03  EoT = 16.37 min
2000-02-12  EoT = -14.23 min
2000-11-03  EoT = 16.36 min

## B. Point cases
Beijing 116.4E 1990-11-03 clock 11:00 | form: LMT 10:45 -> 巳 on 1990-11-03 | TST: 11:01:58 (lng -14.40, EoT 16.37) -> 午 on 1990-11-03  <-- DIFFERENT
Beijing 116.4E 1990-11-03 clock 10:50 | form: LMT 10:35 -> 巳 on 1990-11-03 | TST: 10:51:58 (lng -14.40, EoT 16.37) -> 巳 on 1990-11-03
Beijing 116.4E 1990-02-11 clock 13:20 | form: LMT 13:05 -> 未 on 1990-02-11 | TST: 12:51:24 (lng -14.40, EoT -14.20) -> 午 on 1990-02-11  <-- DIFFERENT
Beijing 116.4E 1990-02-11 clock 23:20 | form: LMT 23:05 -> 子 on 1990-02-12 | TST: 22:51:23 (lng -14.40, EoT -14.22) -> 亥 on 1990-02-11  <-- DIFFERENT
Urumqi 87.6E 1990-11-03 clock 01:00 | form: LMT 22:50 -> 亥 on 1990-11-02 | TST: 23:06:46 (lng -129.60, EoT 16.37) -> 子 on 1990-11-03  <-- DIFFERENT
Urumqi 87.6E 1990-11-03 clock 00:55 | form: LMT 22:45 -> 亥 on 1990-11-02 | TST: 23:01:46 (lng -129.60, EoT 16.37) -> 子 on 1990-11-03  <-- DIFFERENT
Urumqi 87.6E 1990-02-11 clock 03:15 | form: LMT 1:05 -> 丑 on 1990-02-11 | TST: 00:51:13 (lng -129.60, EoT -14.18) -> 子 on 1990-02-11  <-- DIFFERENT
Urumqi 87.6E 2000-02-12 clock 01:20 | form: LMT 23:10 -> 子 on 2000-02-12 | TST: 22:56:11 (lng -129.60, EoT -14.22) -> 亥 on 2000-02-11  <-- DIFFERENT

## C. Full-day scan: clock minutes (0..1439) whose branch or chart date differs between the two paths
Beijing 116.4E 1990-02-11: 168 of 1440 clock minutes differ (11.7%): 01:15-01:28, 03:15-03:28, ... (every odd hour), 23:15-23:28
Beijing 116.4E 1990-11-03: 192 of 1440 clock minutes differ (13.3%): 00:59-01:14, 02:59-03:14, ... (every odd hour), 22:59-23:14
Urumqi 87.6E 1990-02-11: 168 of 1440 clock minutes differ (11.7%): 01:10-01:23, 03:10-03:23, ... (every odd hour), 23:10-23:23
Urumqi 87.6E 1990-11-03: 192 of 1440 clock minutes differ (13.3%): 00:54-01:09, 02:54-03:09, ... (every odd hour), 22:54-23:09
```

Reading the results:
- On dates where |EoT| is near its annual extremes (about −14 min in mid-February, +16 min in early November), roughly **12–13 % of all clock minutes** change 时辰 between the two paths.
- Where the boundary is the 子 boundary, the **chart date** changes as well (Urumqi 1990-11-03 00:55: 1990-11-02 亥 vs 1990-11-03 子).
- The differences come only from EoT, since both paths use the same 120° meridian here. This is the size of the effect behind decision D-1 (§6).

---

## 2. Model and formulas (specification only; to be implemented in Phase 3)

### 2.1 Inputs of `resolveBirthTime()`

| Field | Type / unit | Meaning |
|---|---|---|
| `clock` | `{ year, month, day, hour, minute }` | The reading the user entered, taken as a civil wall-clock reading |
| `civilOffsetMinutes` | integer minutes east of UTC (may be non-integer only for LMT/PLMT eras, e.g. 426.5) | The **actual** clock offset in force at the birth instant, **including** DST, war time and any decreed offset |
| `standardOffsetMinutes` | minutes, or `null` | The zone's standard offset for that period, **excluding** DST: the tzdata Zone-line `STDOFF` (§2.3) |
| `longitude` | decimal °E, or absent | Geographic longitude of the birthplace |
| `solarMode` | `'mean'` \| `'true'` | `'mean'` = local mean time; `'true'` = local apparent (true) solar time |
| `ianaZone` | string | The zone ID as **entered/stored** (e.g. `Asia/Ho_Chi_Minh`), kept for audit. See §5 for ICU canonicalisation. |

### 2.2 Formulas (minutes unless stated)

Let `C` be the clock reading as minutes since 00:00 of the entered calendar date (an integer, 0…1439). Every quantity below is in minutes relative to that same 00:00, so `floor(x / 1440)` gives the day offset.

1. **UTC:** `UTC = C − civilOffsetMinutes`. *`civilOffsetMinutes` is the only offset used to resolve UTC.*
2. **Standard meridian (display only):** `λs = standardOffsetMinutes / 4` (degrees). It is never an input to the calculation.
3. **Local mean time:** `LMT = UTC + 4·λ` (4 minutes of time per degree of longitude). Equivalently:
   `LMT = C − (civil − standard) + 4·(λ − λs)`
   This expands to `C − civil + standard + 4λ − standard = C − civil + 4λ`, so the identity holds for any `standard`. That is why the standard offset can stay explanatory: it changes how the correction is *described*, never its value.
4. **True solar time:** `TST = LMT + EoT`, where EoT comes from the existing NOAA `equationOfTimeMinutes` (`true-solar-time.ts:77-96`). **Specification point to decide in Phase 3:** evaluate γ at the UTC instant (NOAA's `time_offset = eqtime + 4·longitude − 60·timezone` pairs EoT with a UTC-referenced offset) or keep today's local-clock evaluation (`true-solar-time.ts:86-88`). EoT changes by at most about 30 s per day, so the two differ by at most a few seconds, but that can still flip cases sitting on a boundary in `'true'` mode.
5. `solarMode = 'mean'` → the result is `LMT`. `'true'` → the result is `TST`.
6. **No longitude:** no correction. The result is `C` (the clock is used as-is), and EoT is not applied either; this matches `true-solar-time.ts:105,109`.
7. The branch and the late-子 date rule are fed from the result through the existing `branchFromSolarMinutes` and `resolveZiweiDayOffset`, unchanged.

### 2.3 Standard offset: where it comes from

- **Source:** the tzdata Zone line's `STDOFF` column for the period covering the instant. `zic(8)` defines STDOFF as "The amount of time to add to UT to get standard time, without any adjustment for daylight saving" (https://raw.githubusercontent.com/eggert/tz/2026a/zic.8, lines 593-595).
- **Not from `Intl`.** `Intl.DateTimeFormat` exposes only the total offset (`timeZoneName: 'longOffset'`), not the standard/DST split. The standard offset is therefore taken from a small **committed table transcribed from the cited tzdata Zone/Rule lines** for each supported zone and tzdata version (e.g. `Asia/Shanghai`: `8:00 Shang/PRC` from 1901, `asia` 2026a lines 653-655; `Asia/Ho_Chi_Minh`: §3.2).
- **If it can't be established reliably** (an unsupported zone, a pre-standard LMT era, or an unresolved region/period such as northern Vietnam 1947–1954), `standardOffsetMinutes = null`. It is then **explanatory metadata only**: the explanation text says "không xác định" and the calculation is unaffected (§2.2 step 3). It is **never inferred by sampling the offset at a nearby instant.** This supersedes the plan's earlier wording ("the zone's offset at an instant without DST nearby").
- **Vietnam:** every `Asia/Ho_Chi_Minh` line has RULES = `-` (§3.2), so per tzdata `standard == civil` for every Vietnamese period, the 1942–1945 war-era offsets included.

### 2.4 China: behaviour stays bit-identical

China's current behaviour is the special case `civil = standard = 480`, `solarMode = 'mean'`, with λ the city-table longitude (or 120 when no city is chosen):

`LMT = C − 480 + 4λ ≡ C + 4(λ − 120)`, which is `share.ts:30` term for term. With λ = 120 the correction is 0, which equals the "no longitude" rule.

**Floating point.** The two expressions are not just algebraically equal; they produce the same IEEE-754 double:
- `share.ts` computes `C + ((λ − 120) * 4)`. For 60 ≤ λ ≤ 240, `λ − 120` is exact (Sterbenz lemma: x − y is exact when y/2 ≤ x ≤ 2y), and `* 4` is exact (power-of-two scaling). So the result is a single rounding of the real number `C + 4λ − 480`.
- The UTC form `(C − 480) + 4·λ` has `C − 480` exact (small integers) and `4·λ` exact, so it is a single rounding of the **same** real number. The two results are therefore bitwise equal. The same argument covers Vietnam (`λs = 105`) for 52.5 ≤ λ ≤ 210.
- **Empirical confirmation** (probe D, Node 22.22.3): all **296 distinct `cities.ts` longitudes × 1440 clock minutes = 426,240 cases** gave `rawNotEqualU2: 0` (raw doubles identical) and 0 branch/day mismatches. A second probe (`float-forms.js`) drew 20,000 random longitudes in [73°, 135°] at 1, 2, 4 and 6 decimals and stepped clock minutes by 7. Across 4,120,000 cases per precision there were 0 raw differences.

**Two ways a naive unification would NOT be bit-identical:**
1. **Second rounding.** `true-solar-time.ts:116` rounds to the nearest second; `share.ts:30-32` does not round.
   - For the current catalogue (longitudes with ≤ 2 decimals) this never changes the branch or the day: probe D, variant U1, found 0 mismatches in 426,240 cases. That's because offsets are multiples of 0.04 min and boundaries fall on whole minutes.
   - For **arbitrary user coordinates** it does change results (probe E):
     ```
     clock 01:15 lng 116.25:      share raw=60                 -> 丑 ; rounded-to-second=60 -> 丑
     clock 01:15 lng 116.2499999: share raw=59.999999600000024 -> 子 ; rounded-to-second=60 -> 丑
     clock 01:15 lng 116.24999:   share raw=59.99995999999999  -> 子 ; rounded-to-second=60 -> 丑
     ```
   - `legacy-v0` (§4.4) must therefore **not** round. The new calcVersion needs an explicit rounding rule (decision D-6).
2. **Computing through `Date`/milliseconds.** For example `Date.UTC(...) − civil·60000 + 4λ·60000` rounds to whole milliseconds and changes the order of operations, so the guarantee above no longer applies. The legacy path must keep the minute-domain expression exactly, or be the frozen `share.ts` code itself.

Display: `BirthForm.tsx:83` rounds the correction to whole minutes for display only. It must stay display-only.

China DST: unchanged. It is never applied automatically; only the user-confirmed `clock-adjust` flow (`clock-adjust.ts:1-15`) may change the clock, and as §1.3 notes, no UI in this repo wires that flow up yet. Ambiguity detection for China (§2.6) is **informational only**.

### 2.5 Three kinds of offset change (kept separate)

| Kind | Definition | How tzdata encodes it | Effect in the model | Examples |
|---|---|---|---|---|
| **DST** | A seasonal rule: the civil offset differs from standard for part of each year | `Rule` lines with non-zero SAVE, referenced from the Zone line's RULES column | `civil ≠ standard`; the clock reading is DST civil time | China `Rule PRC 1986 only - May 4 2:00 1:00 D`, `1986 1991 Sep Sun>=11 2:00 0 S`, `1987 1991 Apr Sun>=11 2:00 1:00 D` (`asia` 2026a lines 448-450) |
| **Wartime / temporary decreed offset** | A non-seasonal offset decreed for a period, e.g. occupation time | In Vietnam's case tzdata records these as **STDOFF changes** on Zone lines, not as Rules | `civil = standard` per tzdata; the UI may label the period "giờ thời chiến" for explanation only | Indochina +08 from 1942-12-31 23:00 and +09 ("Tokyo time") from 1945-03-14 23:00 (`asia` 2026a lines 4220-4222) |
| **Permanent legal change** | The standard offset itself changes by law | STDOFF change on a new Zone line | `civil = standard` = the new value. The clock reading is correct civil time; **nothing is "adjusted"** | South Vietnam +07 from 1955-07-01 01:00, +08 from 1959-12-31 23:00, +07 from 1975-06-13 (`asia` 2026a lines 4224-4227) |

### 2.6 Ambiguous (fold) and nonexistent (gap) wall-clock times

- **Fold** (clocks set back, so a wall time occurs twice): return **both** candidates `{ utc, civilOffsetMinutes, branch, chartDate }`. **Never pick one.** The user must choose. If both candidates give the same 时辰 and the same chart date, the UI may say so, but the choice is still recorded.
- **Gap** (clocks set forward, so a wall time never occurred): **reject** with an explanation that names the transition, e.g. "23:00–23:59 ngày 31/12/1959 không tồn tại ở miền Nam (đồng hồ vặn từ 23:00 lên 00:00)". **Never shift silently.**
- **Detection method (server, ICU via `Intl`):**
  1. Treat the wall time `W` as if it were UTC.
  2. Collect the candidate offsets `{ off(W − 36h), off(W), off(W + 36h) }`.
  3. For each candidate `o`, accept it if `off(W − o) == o`.
  4. Zero accepted → gap; two → fold; one → normal.
  This relies on the transitions being more than 72 h apart, which holds for every zone considered here. The expected transitions are also cross-checked against the cited Zone/Rule lines (§3.3).
- **Probe** (`fold-gap.js`, Node 22.22.3 / tz 2026a), `Asia/Ho_Chi_Minh`:

```
1911-04-30T23:53  ok                 1911-04-30T16:46:30.000Z (+426.5min)
1911-04-30T23:54  AMBIGUOUS (fold)   1911-04-30T16:47:30.000Z (+426.5min) | 1911-04-30T16:54:00.000Z (+420min)
1911-04-30T23:59  AMBIGUOUS (fold)   1911-04-30T16:52:30.000Z (+426.5min) | 1911-04-30T16:59:00.000Z (+420min)
1911-05-01T00:00  ok                 1911-04-30T17:00:00.000Z (+420min)
1942-12-31T22:59  ok                 1942-12-31T15:59:00.000Z (+420min)
1942-12-31T23:00  NONEXISTENT (gap)
1942-12-31T23:59  NONEXISTENT (gap)
1943-01-01T00:00  ok                 1942-12-31T16:00:00.000Z (+480min)
1945-03-14T22:59  ok                 1945-03-14T14:59:00.000Z (+480min)
1945-03-14T23:00  NONEXISTENT (gap)
1945-03-14T23:59  NONEXISTENT (gap)
1945-03-15T00:00  ok                 1945-03-14T15:00:00.000Z (+540min)
1945-09-01T21:59  ok                 1945-09-01T12:59:00.000Z (+540min)
1945-09-01T22:00  AMBIGUOUS (fold)   1945-09-01T13:00:00.000Z (+540min) | 1945-09-01T15:00:00.000Z (+420min)
1945-09-01T23:59  AMBIGUOUS (fold)   1945-09-01T14:59:00.000Z (+540min) | 1945-09-01T16:59:00.000Z (+420min)
1945-09-02T00:00  ok                 1945-09-01T17:00:00.000Z (+420min)
1947-03-31T23:59  ok                 1947-03-31T16:59:00.000Z (+420min)
1947-04-01T00:00  NONEXISTENT (gap)
1947-04-01T00:59  NONEXISTENT (gap)
1947-04-01T01:00  ok                 1947-03-31T17:00:00.000Z (+480min)
1955-06-30T23:59  ok                 1955-06-30T15:59:00.000Z (+480min)
1955-07-01T00:00  AMBIGUOUS (fold)   1955-06-30T16:00:00.000Z (+480min) | 1955-06-30T17:00:00.000Z (+420min)
1955-07-01T00:59  AMBIGUOUS (fold)   1955-06-30T16:59:00.000Z (+480min) | 1955-06-30T17:59:00.000Z (+420min)
1955-07-01T01:00  ok                 1955-06-30T18:00:00.000Z (+420min)
1959-12-31T22:59  ok                 1959-12-31T15:59:00.000Z (+420min)
1959-12-31T23:00  NONEXISTENT (gap)
1959-12-31T23:59  NONEXISTENT (gap)
1960-01-01T00:00  ok                 1959-12-31T16:00:00.000Z (+480min)
1975-06-12T22:59  ok                 1975-06-12T14:59:00.000Z (+480min)
1975-06-12T23:00  AMBIGUOUS (fold)   1975-06-12T15:00:00.000Z (+480min) | 1975-06-12T16:00:00.000Z (+420min)
1975-06-12T23:30  AMBIGUOUS (fold)   1975-06-12T15:30:00.000Z (+480min) | 1975-06-12T16:30:00.000Z (+420min)
1975-06-12T23:59  AMBIGUOUS (fold)   1975-06-12T15:59:00.000Z (+480min) | 1975-06-12T16:59:00.000Z (+420min)
1975-06-13T00:00  ok                 1975-06-12T17:00:00.000Z (+420min)
Asia/Shanghai 1986-05-04T02:00  NONEXISTENT (gap)      (informational only for China)
Asia/Shanghai 1986-09-14T01:00  AMBIGUOUS (fold)  1986-09-13T16:00:00.000Z (+540min) | 1986-09-13T17:00:00.000Z (+480min)
```

- **China:** current behaviour is kept. The China form uses fixed +480 and the date-only `dst-cn.ts` table, which deliberately differs from tzdata (`dst-cn.ts:15-21`). Fold and gap results for `Asia/Shanghai` are informational and never change a China chart automatically.

### 2.7 Vietnam default solar mode — DECISION for the user (D-1)

- **Recommendation: `'mean'`**, the same mode as the current China form. One pipeline then treats both countries alike: LMT from the actual civil offset and the birthplace longitude, with no EoT.
- Under `'mean'`, Vietnam's correction for a present-day birth is `4·(λ − 105)`. For Hà Nội (λ ≈ 105.85, derived from the backzone LMT `7:03:24` = 423.4 min / 4) that is about +3.4 min. For TP HCM (λ = 106°40′ = 106.667, `zone.tab` `+1045+10640`) it is about +6.7 min.
- **Switching either country to `'true'` changes results.** In China it would alter about 12–13 % of clock minutes on dates with large EoT (§1.6). It needs evidence about mainstream practice, and its own decision and PR. It is **not** part of the Vietnamese localization.

---

## 3. Historical timezone verification for Vietnam (north and south independently)

### 3.1 Sources and versions

- **Runtime tzdata/ICU:** Node 22.22.3 → `tz 2026a`, `icu 78.2` (`process.versions`). Homebrew Node 26.0.0 on the same machine reports `tz 2026a`, `icu 78.3`.
- **tzdata 2026a** (the runtime's version): `https://data.iana.org/time-zones/releases/tzdata2026a.tar.gz` (published 2026-03-02, SHA-256 `77b54172…ba2b7`). The `asia` and `backzone` files are byte-identical to `https://raw.githubusercontent.com/eggert/tz/2026a/{asia,backzone}` (checked with `cmp`).
- **tzdata 2026f** (latest): `https://data.iana.org/time-zones/releases/tzdata2026f.tar.gz` (published 2026-10-28, SHA-256 `01b4a91c…a3d3d`). Also byte-identical to the eggert/tz `2026f` tag.
- **Difference between 2026a and 2026f for Vietnam: none.** The extracted "Vietnam (southern)" block of `asia` and the `Asia/Hanoi` block of `backzone` diff as identical. The `zone1970.tab` VN/Bangkok rows are unchanged. Only line numbers shift: the `Asia/Ho_Chi_Minh` Zone line is at `asia:4218` in 2026a and `asia:4230` in 2026f.
- **Historical cross-checks:**
  - [H1] **Trần Tiến Bình, "Lịch Việt Nam thế kỷ XX–XXI"**, quoted verbatim in Vietnamese at http://www.thoigian.com.vn/?mPage=P80D01 (fetched 2026-11-07). This is the source tzdata itself cites.
  - [H2] **Brian Inglis's English rendering of [H1]**, tz mailing list, 2014-10-04: https://mm.icann.org/pipermail/tz/2014-October/021654.html
  - [H3] **Government gazettes cited inside tzdata** (quoted under §3.2): Việt Nam Dân Quốc Công Báo No. 1 (1945-09-29); Công Báo Việt Nam No. 92 (1955-07-02), Dụ 46; Công Báo VNCH 1960 part 1, Sắc lệnh 362-TTP. I did not open these scans myself; they are cited **as tzdata cites them**.
  - [H4] **Wikipedia "Time in Vietnam"** (https://en.wikipedia.org/wiki/Time_in_Vietnam): its history section is **uncited** (the page is tagged as needing sources). Used only as a weak cross-check.
  - [H5] **Wikipedia "Vietnamese Demilitarized Zone"** (https://en.wikipedia.org/wiki/Vietnamese_Demilitarized_Zone): the demarcation line, Geneva Accords effective 21 July 1954, and the zone in Quảng Trị province.

### 3.2 Exact tzdata text (2026a; identical in 2026f)

`asia` 2026a lines 4100-4104 (2026f lines 4112-4116):
```
# Vietnam (northern)
# Zone	NAME		STDOFF	RULES	FORMAT	[UNTIL]
Zone	Asia/Bangkok	6:42:04	-	LMT	1880
			6:42:04	-	BMT	1920 Apr # Bangkok Mean Time
			7:00	-	%z
```

`asia` 2026a lines 4143-4238 (2026f 4155-4250), maintainer comments and Zone:
```
# Vietnam (southern)

# From Paul Eggert (2014-10-04):
# Milne gives 7:16:56 for the meridian of Saigon in 1899, as being
# used in Lower Laos, Cambodia, and Annam.  But this is quite a ways
# from Saigon's location.  For now, ignore this and stick with Shanks
# and Pottenger for LMT before 1906.
...
# From Paul Eggert (2024-01-14) after a 2014 heads-up from Trần Ngọc Quân
# and a 2024-01-14 heads-up from Đoàn Trần Công Danh:
# Trần Tiến Bình's authoritative book "Lịch Việt Nam: thế kỷ XX-XXI (1901-2100)"
# (Nhà xuất bản Văn Hoá - Thông Tin, Hanoi, 2005), pp 49-50,
# is quoted verbatim in:
# http://www.thoigian.com.vn/?mPage=P80D01
# is translated by Brian Inglis in:
# https://mm.icann.org/pipermail/tz/2014-October/021654.html
# and is the basis for the information below.
#
# The 1906 transition was effective July 1 and standardized Indochina to
# Phù Liễn Observatory, legally 104° 17' 17" east of Paris.
# ...
# The following transitions occurred in Indochina in general (before 1954)
# and in South Vietnam in particular (after 1954):
# To 07:00 on 1911-05-01.
# To 08:00 on 1942-12-31 at 23:00.
# To 09:00 on 1945-03-14 at 23:00.
# To 07:00 on 1945-09-02 in Vietnam.
# To 08:00 on 1947-04-01 in French-controlled Indochina.
# To 07:00 on 1955-07-01 in South Vietnam.
# To 08:00 on 1959-12-31 at 23:00 in South Vietnam.
# To 07:00 on 1975-06-13 in South Vietnam.
# ...
# Here is the decision for the September 1945 transition:
# Võ Nguyên Giáp, Việt Nam Dân Quốc Công Báo, No. 1 (1945-09-29), page 13
# http://baochi.nlv.gov.vn/baochi/cgi-bin/baochi?a=d&d=JwvzO19450929.2.5&dliv=none
# It says that on 1945-09-01 at 24:00, Vietnam moved back two hours, to +07.
# It also mentions a 1945-03-29 decree (by a Japanese Governor-General)
# to set the time zone to +09, but does not say whether that decree
# merely legalized an earlier change to +09.
#
# July 1955 transition:
# Ngô Đình Diệm, Công Báo Việt Nam, No. 92 (1955-07-02), page 1780-1781
# Ordinance (Dụ) No. 46 (1955-06-25)
# http://ddsnext.crl.edu/titles/32341#?c=0&m=29&s=0&cv=4&r=0&xywh=-89%2C342%2C1724%2C1216
# It says that on 1955-07-01 at 01:00, South Vietnam moved back 1 hour (to +07).
#
# December 1959 transition:
# Ngô Đình Diệm, Công Báo Việt Nam Cộng Hòa, 1960 part 1 (1960-01-02), page 62
# Decree (Sắc lệnh) No. 362-TTP (1959-12-30)
# http://ddsnext.crl.edu/titles/32341#?c=0&m=138&s=0&cv=793&r=0&xywh=-54%2C1504%2C1705%2C1202
# It says that on 1959-12-31 at 23:00, South Vietnam moved forward 1 hour (to +08).

# Zone	NAME		STDOFF	RULES	FORMAT	[UNTIL]
		#STDOFF	7:06:30.13
Zone Asia/Ho_Chi_Minh	7:06:30 -	LMT	1906 Jul  1
			7:06:30	-	PLMT	1911 May  1 # Phù Liễn MT
			7:00	-	%z	1942 Dec 31 23:00
			8:00	-	%z	1945 Mar 14 23:00
			9:00	-	%z	1945 Sep  1 24:00
			7:00	-	%z	1947 Apr  1
			8:00	-	%z	1955 Jul  1 01:00
			7:00	-	%z	1959 Dec 31 23:00
			8:00	-	%z	1975 Jun 13
			7:00	-	%z

# From Paul Eggert (2019-02-19):
#
# The Ho Chi Minh entry suffices for most purposes as it agrees with all of
# Vietnam since 1975-06-13.  Presumably clocks often changed in south Vietnam
# in the early 1970s as locations changed hands during the war; however the
# details are unknown and would likely be too voluminous for this database.
#
# For timestamps in north Vietnam back to 1970 (the tzdb cutoff),
# use Asia/Bangkok; see the VN entries in the file zone1970.tab.
# For timestamps before 1970, see Asia/Hanoi in the file 'backzone'.
```

`backzone` 2026a lines 1032-1044 (2026f 1033-1045):
```
# Vietnam
# From Paul Eggert (2014-10-13):
# See Asia/Ho_Chi_Minh for the source for this data.
# Trần's book says the 1954-55 transition to 07:00 in Hanoi was in
# October 1954, with exact date and time unspecified.
Zone	Asia/Hanoi	7:03:24 -	LMT	1906 Jul  1
			7:06:30	-	PLMT	1911 May  1
			7:00	-	+07	1942 Dec 31 23:00
			8:00	-	+08	1945 Mar 14 23:00
			9:00	-	+09	1945 Sep  2
			7:00	-	+07	1947 Apr  1
			8:00	-	+08	1954 Oct
			7:00	-	+07
```

Other relevant lines (2026a):
- `backward:319`: `Link Asia/Ho_Chi_Minh Asia/Saigon`
- `backward:224-225`: `Link Asia/Bangkok Asia/Phnom_Penh` and `… Asia/Vientiane`
- `zone1970.tab:305`: `TH,CX,KH,LA,VN +1345+10031 Asia/Bangkok north Vietnam`
- `zone1970.tab:348`: `VN +1045+10640 Asia/Ho_Chi_Minh south Vietnam`
- `zone.tab:440`: `VN +1045+10640 Asia/Ho_Chi_Minh`

There is **no `Link` to `Asia/Hanoi` in `backward`**, so `Asia/Hanoi` exists only when tzdata is built with backzone data.

**Semantics used for deriving instants:**
- `zic(8)` says UNTIL "is interpreted using the rules in effect just before the transition" (zic.8 lines 657-658, tag 2026a).
- When no suffix is given, "local (wall clock) time is assumed" (zic.8 lines 514-515).
- All Vietnamese lines have RULES `-`, so wall time = the STDOFF of the line that is ending.

### 3.3 Derived transition instants, confirmed with ICU one minute either side

`Asia/Ho_Chi_Minh` (south; and per tzdata all of Vietnam since 1975-06-13). Probe `intl-probe.js`, Node 22.22.3 / tz 2026a / ICU 78.2, using `Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'longOffset' })`. The two right-hand columns show the local time and offset at T − 1 min and T + 1 min.

| # | Zone line (UNTIL) | Derived UTC instant T | Wall clock change | ICU at T − 1 min | ICU at T + 1 min | Fold/gap |
|---|---|---|---|---|---|---|
| 0 | LMT 7:06:30 → PLMT 7:06:30, `1906 Jul 1` | 1906-06-30 16:53:30Z | none (same offset) | 23:59 +07:06:30 | 00:01 +07:06:30 | — |
| 1 | PLMT → +07, `1911 May 1` | 1911-04-30 16:53:30Z | 00:00 PLMT → 23:53:30 | 1911-04-30 23:59 GMT+07:06:30 | 1911-04-30 23:54:30 GMT+07:00 | fold 23:53:30–23:59:59 (6.5 min) |
| 2 | +07 → +08, `1942 Dec 31 23:00` | 1942-12-31 16:00Z | 23:00 → 00:00 | 22:59 +07:00 | 1943-01-01 00:01 +08:00 | gap 23:00–23:59 |
| 3 | +08 → +09, `1945 Mar 14 23:00` | 1945-03-14 15:00Z | 23:00 → 00:00 | 22:59 +08:00 | 03-15 00:01 +09:00 | gap 23:00–23:59 |
| 4 | +09 → +07, `1945 Sep 1 24:00` | 1945-09-01 15:00Z | 24:00 → 22:00 | 23:59 +09:00 | 22:01 +07:00 | fold 22:00–23:59 (2 h) |
| 5 | +07 → +08, `1947 Apr 1` | 1947-03-31 17:00Z | 00:00 → 01:00 | 03-31 23:59 +07:00 | 04-01 01:01 +08:00 | gap 00:00–00:59 |
| 6 | +08 → +07, `1955 Jul 1 01:00` | 1955-06-30 17:00Z | 01:00 → 00:00 | 07-01 00:59 +08:00 | 07-01 00:01 +07:00 | fold 00:00–00:59 |
| 7 | +07 → +08, `1959 Dec 31 23:00` | 1959-12-31 16:00Z | 23:00 → 00:00 | 22:59 +07:00 | 1960-01-01 00:01 +08:00 | gap 23:00–23:59 |
| 8 | **+08 → +07, `1975 Jun 13`** | **1975-06-12 16:00Z** | **00:00 (06-13) → 23:00 (06-12)** | 1975-06-12 23:59 GMT+08:00 | 1975-06-12 23:01 GMT+07:00 | **fold 1975-06-12 23:00–23:59** |

Every row matched the tzdata-derived instant exactly. Raw output: `asia`-derived transitions in the Ho_Chi_Minh block of the probe output, e.g. `1975-06-12T16:00:00Z ... -1min: 1975-06-12 23:59:00 GMT+08:00 / +1min: 1975-06-12 23:01:00 GMT+07:00`.

**This supersedes the earlier month-level probe** (+08:00 on 1975-06-01, +07:00 on 1975-07-01). The southern 1975 change happens at **local 00:00 on 13 June 1975 (+08), which becomes 23:00 on 12 June (+07); UTC 1975-06-12 16:00**. The time of day (00:00) is tzdata's encoding of the bare date "1975 Jun 13". [H1] gives only the date ("Ngày 13/6/1975 … giờ Sài Gòn được vặn chậm lại 1 giờ") and no hour, so the **hour is unverified**.

**ICU data facts (Node 22.22.3, ICU 78.2), as observed:**
- `new Intl.DateTimeFormat('en', { timeZone: 'Asia/Hanoi' })` throws `RangeError: Invalid time zone specified: Asia/Hanoi`. **ICU's data does not include backzone zones.**
- `Asia/Phnom_Penh` and `Asia/Vientiane` produce exactly the `Asia/Bangkok` offsets: +06:42:04 before 1920, and +07:00 throughout 1942–1975 with no 1942/1945/1947 transitions. That is consistent with the default `backward` links (`backward:224-225`), not the backzone Zone lines. More evidence that backzone is not included.
- `resolvedOptions().timeZone` for `Asia/Ho_Chi_Minh` returns **`Asia/Saigon`**, and `Intl.supportedValuesOf('timeZone')` lists `Asia/Saigon` but **not** `Asia/Ho_Chi_Minh` (same on Node 26 / ICU 78.3). See §5 for why the stored ID must be the input string.
- Before 1906 ICU shows `GMT+07:06:30` for `Asia/Ho_Chi_Minh`. That is tzdata's LMT, deliberately set equal to PLMT; tzdata notes Milne's 7:16:56 and ignores it.
- `Asia/Bangkok` gives `+07:00` at every probe point from 1942 onwards, including during Vietnam's +08 and +09 periods. For dates **before 1954/55** it is therefore **not** a usable proxy for any part of Vietnam.

### 3.4 Historical cross-check ([H1] original Vietnamese, [H2] English)

[H1] (thoigian.com.vn, Trần Tiến Bình) lists, among others:
- "Ngày 1/1/1943 … liên kết Đông Dương vào múi giờ 8 … vặn nhanh lên 60 phút vào lúc 23 giờ ngày 31/12/1942."
- "Ngày 14/3/1945 … múi giờ 9 … vặn nhanh lên 1 giờ vào 23 giờ ngày 14/3/1945."
- "Ngày 2/9/1945 … Chính phủ Lâm thời nước Việt Nam dân chủ cộng hoà tuyên bố lấy múi giờ 7 làm giờ chính thức."
- "Ngày 1/4/1947 … trong các vùng bị tạm chiếm ở Việt Nam, ở Lào và Campuchia giờ chính thức là múi giờ 8 kể từ ngày 1/4/1947. Tuy nhiên trong các vùng giải phóng vẫn giữ múi giờ 7 và sau Hiệp định giơnevơ các vùng giải phóng ở miền bắc cũng theo múi giờ 7 (Hà nội từ 10/1954 và Hải phòng cuối tháng 5/1955)."
- "Ngày 1/7/1955 Miền Nam Việt Nam trở lại múi giờ 7 từ 0 giờ ngày 1/7/1955."
- "Ngày 1/1/1960 … Sắc lệnh số 362-TtP ngày 30/12/1959 … vặn nhanh lên 1 giờ kể từ 23 giờ đêm ngày 31/12/1959."
- "Ngày 31/12/1967 … Quyết đinh 121/CP ngày 8/8/1967 khẳng định giờ chính thức của nước ta là múi giờ 7 kể từ 0 giờ ngày 1/1/1968."
- "Ngày 13/6/1975 … trở lại múi giờ 7 và giờ Sài Gòn được vặn chậm lại 1 giờ."

[H2] (Inglis) renders the same list in English.

Agreements and conflicts:
- **Agree** (tzdata ⇄ [H1]): 1911-05-01, 1942-12-31 23:00, 1945-03-14 23:00, 1945-09-02 (tzdata "Sep 1 24:00" is the same instant), 1959-12-31 23:00, 1975-06-13 (date).
- **Conflict, 1955-07-01 hour:** [H1] says "từ 0 giờ"; tzdata uses **01:00** citing the gazette ([H3], Dụ 46). tzdata's choice rests on a primary source, so it is preferred. Confidence: medium-high.
- **Northern 1947–1954: [H1] contradicts a single "Hanoi" zone.** French-occupied areas used +08 from 1947-04-01, while liberated (Việt Minh) areas stayed on +07. `backzone` `Asia/Hanoi` models only Hanoi city (French-held until October 1954). [H1] adds that **Hải Phòng** moved to +07 only at the "end of May 1955". tzdata has no zone for that.
- **1967/68 Decision 121/CP** confirms +07 nationally (for the DRV) from 1968-01-01; there is no offset change for the north.
- [H4] (uncited) broadly agrees: North "1 April 1947 until the Geneva Accords: No Standard Time; UTC+7 for peaceful zones, UTC+8 for zones under attack"; South +8 to 1955-06-30, +7 1955-07-01…1959-12-31, +8 1960-01-01…1975-06-12, +7 from 1975-06-13. Its pre-1906 LMT (+7:06:40) differs from tzdata's; it carries no weight.

### 3.5 Per-period, per-region table

Confidence levels:
- **H** = tzdata Zone line plus an independent historical source, or a primary gazette that tzdata cites.
- **M** = a single source, or the time of day is unverified.
- **L** = inference.
- **U** = unresolved.

**South** (south of the 1954 demarcation line: the Bến Hải river in Quảng Trị, "nominally … the 17th parallel", Geneva Accords effective 21 July 1954 [H5]):

| Period (local wall clock) | Civil offset | Standard (tzdata) | Kind | Source | Conf. |
|---|---|---|---|---|---|
| … → 1906-07-01 00:00 | +7:06:30 (LMT per tzdata) | n/a (LMT) | — | `asia:4218` | L (tzdata says it is following Shanks & Pottenger, not Milne) |
| 1906-07-01 → 1911-05-01 00:00 | +7:06:30 PLMT | +7:06:30 | legal | `asia:4219`, [H1] | H for the date, M for the exact offset (tzdata: "guess the former") |
| 1911-05-01 → 1942-12-31 23:00 | +7:00 | +7:00 | permanent | `asia:4220`, [H1] | H |
| 1943-01-01 00:00 → 1945-03-14 23:00 | +8:00 | +8:00 (tzdata) | wartime/decreed | `asia:4221`, [H1] | H |
| 1945-03-15 00:00 → 1945-09-01 24:00 | +9:00 | +9:00 (tzdata) | wartime (Japanese) | `asia:4222`, [H1], [H3] | H |
| 1945-09-01 22:00 (fold) → 1947-04-01 00:00 | +7:00 | +7:00 | legal (DRV) | `asia:4223`, [H1], [H3] | H |
| 1947-04-01 01:00 → 1955-07-01 01:00 | +8:00 in French-controlled areas | +8:00 | decreed | `asia:4224`, [H1] | H for French-held towns; **U** for Việt Minh-held southern areas ([H1] says +7 there) |
| 1955-07-01 00:00 (fold) → 1959-12-31 23:00 | +7:00 | +7:00 | permanent | `asia:4225`, [H3] Dụ 46 | H (hour per gazette; [H1] says 0 giờ) |
| 1960-01-01 00:00 → 1975-06-13 00:00 | +8:00 (RVN) | +8:00 | permanent | `asia:4226`, [H3] SL 362-TTP, [H1] | H for RVN-administered areas. **U** for areas held by the NLF/PRG: tzdata says clocks "presumably … often changed … details are unknown" |
| 1975-06-12 23:00 (fold) → now | +7:00 | +7:00 | permanent | `asia:4227`, [H1] | H for the date, **M for the hour** (00:00 is tzdata's encoding) |

**North** (DRV after 1954). No tzdata zone covers the whole north for this era, so each row is sourced separately:

| Period | Civil offset | Source | Conf. |
|---|---|---|---|
| … → 1906-07-01 | LMT; tzdata backzone gives Hanoi +7:03:24 | `backzone:1037` | L. Backzone is not available in ICU. |
| 1906-07-01 → 1945-09-02 | Same Indochina-wide sequence as the south: PLMT, +7 from 1911-05-01, +8 from 1942-12-31 23:00, +9 from 1945-03-14 23:00 | `backzone:1038-1041`; [H1] says "cho tất cả các nước Đông Dương" | H |
| 1945-09-02 → 1947-04-01 | +7 | `backzone:1042`, [H1], [H3] | H |
| 1947-04-01 → Oct 1954 (Hà Nội) / end of May 1955 (Hải Phòng) | **+8 in French-occupied areas** (Hà Nội city: backzone `+08 … 1954 Oct`), **+7 in liberated areas** ([H1]) | `backzone:1043`, [H1], [H4] | **U by province.** It depended on military control, which changed over time. Hà Nội's switch-back date is "October 1954, with exact date and time unspecified" (`backzone:1035-1036`), and tzdata's `1954 Oct` = Oct 1 00:00 is a placeholder. Hải Phòng "cuối tháng 5/1955" has no exact day. |
| Oct 1954 / May 1955 → 1968-01-01 | +7 | [H1] | M-H. A single scholarly source; consistent with the 1967 decree confirming +7. |
| 1968-01-01 → 1970 | +7 (Decision 121/CP) | [H1] | H |
| 1970 → 1975-06-13 | +7 | tzdata: "For timestamps in north Vietnam back to 1970 … use Asia/Bangkok" (`asia:4236-4237`), `zone1970.tab:305` | H. **`Asia/Bangkok` is a supported proxy for this period only.** |
| 1975-06-13 → now | +7 | tzdata: `Asia/Ho_Chi_Minh` "agrees with all of Vietnam since 1975-06-13" (`asia:4231-4232`) | H |

### 3.6 Proposed province → zone/rule mapping (34 province-level units)

**Source for the list:** Resolution **202/2025/QH15** of the National Assembly. It was adopted 2025-06-12 and signed by Chairman Trần Thanh Mẫn.
- Art. 2(1): "This Resolution takes effect from the date of its adoption."
- Art. 2(2): the local governments of the reorganised units "officially commence operations from July 01, 2025".
- It forms 23 units by merger, keeps 11 unchanged, and totals "34 provincial-level administrative divisions … 28 provinces and 6 cities".
- Source: LuatVietnam English text, https://english.luatvietnam.vn/co-cau-to-chuc/resolution-202-2025-qh15-reorganization-of-provincial-level-administrative-divisions-402728-d1.html (fetched 2026-11-07). The official Vietnamese text on thuvienphapluat.vn returned HTTP 403 and the vbpl.vn attachment link returned no document body, so **the list below rests on that secondary transcription**. Phase 3 should re-check it against the Công báo text.

**Proposed rule:**
- **Every unit, instant ≥ 1975-06-12T16:00Z:** `Asia/Ho_Chi_Minh` (+07). Confidence H.
- **Before that:** a project-defined, per-region historical table (`vn-south` / `vn-north`, below), **not** a raw IANA zone for the north. Reasons: ICU has no `Asia/Hanoi` (§3.3), and `Asia/Bangkok` is endorsed only from 1970.
  - `vn-south` = the `Asia/Ho_Chi_Minh` line set, which ICU can resolve directly.
  - `vn-north` = the north table in §3.5. Its unresolved rows return `civilOffset` **unknown**: the UI must ask the user for the clock offset they believe applied, or refuse to auto-resolve. It never guesses.
- Region membership 1954–1975 follows the pre-2025 provinces that were merged. That is why a merged unit can't always be mapped by its new name.

| # | Unit (2025) | Formed from (pre-2025) | 1954–1975 region | Proposed historical rule | Evidence status |
|---|---|---|---|---|---|
| 1 | TP Hà Nội | unchanged | North | vn-north | §3.5 north; 1947–54 rows U |
| 2 | Cao Bằng | unchanged | North | vn-north | idem |
| 3 | Điện Biên | unchanged | North | vn-north | idem |
| 4 | Lai Châu | unchanged | North | vn-north | idem |
| 5 | Lạng Sơn | unchanged | North | vn-north | idem |
| 6 | Sơn La | unchanged | North | vn-north | idem |
| 7 | Quảng Ninh | unchanged | North | vn-north | idem |
| 8 | Thanh Hóa | unchanged | North | vn-north | idem |
| 9 | Nghệ An | unchanged | North | vn-north | idem |
| 10 | Hà Tĩnh | unchanged | North | vn-north | idem |
| 11 | Tuyên Quang | Hà Giang + Tuyên Quang | North | vn-north | idem |
| 12 | Lào Cai | Yên Bái + Lào Cai | North | vn-north | idem |
| 13 | Thái Nguyên | Bắc Kạn + Thái Nguyên | North | vn-north | idem |
| 14 | Phú Thọ | Vĩnh Phúc + Hòa Bình + Phú Thọ | North | vn-north | idem |
| 15 | Bắc Ninh | Bắc Giang + Bắc Ninh | North | vn-north | idem |
| 16 | Hưng Yên | Thái Bình + Hưng Yên | North | vn-north | idem |
| 17 | TP Hải Phòng | Hải Phòng + Hải Dương | North | vn-north; **old Hải Phòng city: +8 until "end of May 1955"** ([H1]) | U (no exact day) |
| 18 | Ninh Bình | Hà Nam + Nam Định + Ninh Bình | North | vn-north | idem |
| 19 | **Quảng Trị** | **Quảng Bình + Quảng Trị** | **Split** by the Bến Hải line [H5] | By **coordinates**: north of the line → vn-north, south → vn-south | U for points near the line; the representative point must not be used for 1954–75 births |
| 20 | TP Huế | unchanged (Thừa Thiên Huế) | South | vn-south (`Asia/Ho_Chi_Minh`) | H (RVN areas); U for contested areas 1960–75 |
| 21 | TP Đà Nẵng | Đà Nẵng + Quảng Nam | South | vn-south | idem |
| 22 | Quảng Ngãi | Kon Tum + Quảng Ngãi | South | vn-south | idem |
| 23 | Gia Lai | Bình Định + Gia Lai | South | vn-south | idem |
| 24 | Khánh Hòa | Ninh Thuận + Khánh Hòa | South | vn-south | idem |
| 25 | Lâm Đồng | Đắk Nông + Bình Thuận + Lâm Đồng | South | vn-south | idem |
| 26 | Đắk Lắk | Phú Yên + Đắk Lắk | South | vn-south | idem |
| 27 | TP Hồ Chí Minh | TP HCM + Bà Rịa–Vũng Tàu + Bình Dương | South | vn-south | idem |
| 28 | Đồng Nai | Bình Phước + Đồng Nai | South | vn-south | idem |
| 29 | Tây Ninh | Long An + Tây Ninh | South | vn-south | idem |
| 30 | TP Cần Thơ | Cần Thơ + Sóc Trăng + Hậu Giang | South | vn-south | idem |
| 31 | Vĩnh Long | Bến Tre + Trà Vinh + Vĩnh Long | South | vn-south | idem |
| 32 | Đồng Tháp | Tiền Giang + Đồng Tháp | South | vn-south | idem |
| 33 | Cà Mau | Bạc Liêu + Cà Mau | South | vn-south | idem |
| 34 | An Giang | Kiên Giang + An Giang | South | vn-south | idem |

Counts: North 18, South 15, split 1 (= 34). The north/south assignment per pre-2025 province rests on general knowledge of the 1954 partition along the Bến Hải line [H5]. **No per-province historical-time source was found.** The assignment is a proposal for the user to approve (decision D-3).

### 3.7 Known limitations (explicit)

1. **1954–1975 around the 17th parallel.** New Quảng Trị straddles the line. Births near it need exact coordinates and an explicit user-confirmed region; a province default is unsafe.
2. **North 1947–1954/55.** The offset depended on French versus Việt Minh control, which changed place by place over time. It is unresolved by province. Hà Nội's return to +07 has no exact date ("October 1954"); Hải Phòng's has no exact day ("cuối tháng 5/1955").
3. **South 1947–1955 and 1960–1975 in non-RVN-administered areas.** tzdata explicitly says the details are unknown.
4. **1975-06-13 time of day.** Only the date is sourced; 00:00 is tzdata's encoding.
5. **Before 1911, and especially before 1906.** LMT and PLMT values are tzdata reconstructions ("guess"); the north's LMT (+7:03:24) exists only in backzone, which ICU lacks. The form accepts years from 1900 (`BirthForm.tsx:93`), so these years are reachable.
6. **Gazette scans not opened.** The [H3] gazettes are cited as tzdata cites them; I did not read them.
7. **ICU has no backzone.** Server-side `Intl` cannot resolve `Asia/Hanoi`. Anything beyond `Asia/Ho_Chi_Minh` / `Asia/Bangkok` has to come from a committed, cited table.

---

## 4. Locations, persistence and legacy migration (specification)

### 4.1 Location catalogue

- **Stable IDs**, lowercase ASCII, dot-separated: `vn.ha-noi`, `vn.ho-chi-minh`, `vn.quang-tri`, `cn.beijing`, `cn.beijing.dongcheng`. IDs are never reused or renamed. A renamed place gets a new display name, not a new ID; a merged place keeps its old ID as an alias.
- Each entry has:
  - `lat`, `lon` (decimal degrees, WGS84)
  - `sourceNote` (dataset plus retrieval date)
  - `approximate: boolean` (true for province/city representative points)
  - `ianaZone`
  - `historicalRule` (`vn-north` / `vn-south` / `cn-default`, etc.)
  - for VN, `region1954: 'north' | 'south' | 'split'`
- **China** keeps its existing name-keyed catalogue (`cities.ts`). IDs are added alongside the names and values are not changed. `cities.ts:21-23` notes that old history entries depend on the "北京" city-level entry.
- **Exact-coordinate entry:** the user may enter `lat`/`lon` directly. Then `approximate = false`. The zone and historical region are still derived (for VN, via region1954 / the split rule) and shown for confirmation.
- **"Gần đúng" labelling.** When a representative point is used, the result carries a "gần đúng" badge and an error range: `±(province longitude span × 4 min) / 2` around the computed time, or the full `span × 4 min` band. For example, `cities.ts:22-23` gives Beijing's span as 115.98–117.12°E ≈ 1.14° ≈ 4.6 min. When the time lies within that band of a 时辰 boundary, the UI warns that the branch depends on the exact place. Vietnamese per-province spans must be computed in Phase 3 from a cited boundary dataset; **no Vietnamese span figures are given here** because none were verified.

### 4.2 Calculation parameters persisted with every chart

Stored per chart (history entry and share payload):

```
calc: {
  calcVersion: 'v1' | 'legacy-v0',
  locationId?: string,            // absent for exact-coordinate entry
  lat?: number, lon?: number,     // the values actually used
  approximate: boolean,
  ianaZone: string,               // the input ID, e.g. 'Asia/Ho_Chi_Minh' (not ICU's canonical 'Asia/Saigon')
  historicalRule?: string,        // e.g. 'vn-south'
  civilOffsetMinutes: number,
  standardOffsetMinutes: number | null,
  solarMode: 'mean' | 'true',
  foldChoice?: 'earlier' | 'later',   // only when the wall time was ambiguous
  tzdataVersion: string,          // process.versions.tz at resolution time
  icuVersion: string,
}
```

**Rule: a saved chart is always re-rendered from its own stored `calc`.** It is never recomputed from later catalogue coordinates, later tzdata, or a later calcVersion.

### 4.3 What is stored today (for contrast)

See §1.5:
- `ziwei_history` stores `{ id, label, form: BirthFormState, savedAt }` (`history.ts:7-12`).
- Share URLs carry `n, y, m, d, u | h, mi, p, c, lo (omitted when 0 or 120), g` (`share.ts:51-68`).
- Neither carries a calcVersion, timezone or solar mode, and neither is called from any route in this repo.

### 4.4 Legacy migration

- Any history entry or share URL **without `calcVersion`** is tagged `calcVersion: 'legacy-v0'` **on load**.
- **`legacy-v0`** is a **frozen copy of today's formula**: `C + (λ − 120) × 4` with fixed +480, mean mode, **no rounding**, then `branchFromSolarMinutes` and `resolveZiweiDayOffset('next-day')`. That is exactly `share.ts:29-37`, applied to the **stored** `form.longitude` (or 120 when absent, matching `share.ts:86` and `BirthForm.tsx:56`).
- It is never recalculated with the new model and never with updated catalogue coordinates for its province or city. Example: if the 北京 entry's longitude changes, old entries keep 116.4.
- **Optional explicit action** "Tính lại theo cách mới" (recalculate with the new model): it creates a **new** entry with `calcVersion: 'v1'`. The original entry is kept unchanged, so the action is reversible.
- A regression test pins `legacy-v0` to `birthtime-baseline.zh` (the D5 fixture; `scripts/regression/birthtime-baseline.test.ts` exists as untracked work in progress at the time of writing).
- Known legacy quirk to preserve, not fix: `lo` is omitted for longitude 0 as well as 120 (`share.ts:65`), so a legacy URL can never encode 0°. That's irrelevant to China, and new `v1` payloads must not inherit it.

---

## 5. Server-side resolution (specification)

- Offsets are resolved **on the server only**, through ICU via `Intl`. They are **never recomputed in the browser**, because browser ICU/tzdata versions vary by vendor and OS. The server returns:
  ```
  { ianaZone, civilOffsetMinutes, standardOffsetMinutes, tzdataVersion: process.versions.tz, icuVersion: process.versions.icu,
    status: 'ok' | 'ambiguous' | 'nonexistent' | 'unresolved', candidates?: [...] }
  ```
- `civilOffsetMinutes` comes from `Intl.DateTimeFormat(…, { timeZone, timeZoneName: 'longOffset' })` at the resolved UTC instant, using the fold/gap method in §2.6. For `vn-north` rows marked U, and for any zone outside the supported list, the status is `'unresolved'` and the user must supply or confirm the offset.
- `standardOffsetMinutes` comes from the committed table transcribed from tzdata (§2.3), and only for supported zones. Otherwise it is `null`.
- **Risks:**
  - **tzdata/ICU drift.** Node 22.22.3 ships tz 2026a (ICU 78.2); the latest tzdata is 2026f. Node 26.0.0 here also reports 2026a (ICU 78.3). Hosts may also run Node built with system ICU or `small-icu`, giving different data again. Vietnam's data is identical in 2026a and 2026f (§3.1), so there is no effect today. Recording `tzdataVersion` and `icuVersion` per chart makes any future drift auditable.
  - **Canonical IDs.** ICU canonicalises `Asia/Ho_Chi_Minh` → `Asia/Saigon` in `resolvedOptions()` and in `supportedValuesOf` (§3.3). Store the **input** ID and do not round-trip through `resolvedOptions()`. Validate input against an allow-list, not against `supportedValuesOf` (which lacks `Asia/Ho_Chi_Minh`).
  - **No backzone in ICU.** Pre-1970 northern history can't come from ICU (§3.3).
  - **Runtime.** The resolver must run in the Node.js runtime (it needs `process.versions`), not an Edge runtime whose ICU/tzdata is unknown. This is to be checked against the D4 server-action design.
  - **Committed table vs runtime tzdata.** If a future tzdata release changes a Vietnamese line, the committed standard-offset table and the runtime ICU could disagree. A test should assert that the table's transition instants match `Intl` one minute either side (the §3.3 probe made into a test).

---

## 6. Open questions / decisions for the user

| ID | Decision | Recommendation / options |
|---|---|---|
| **D-1** | **Vietnam default solar mode** | Recommend `'mean'`, the same as the China form. Switching **either** country to `'true'` changes results (about 12–13 % of clock minutes on high-EoT dates, §1.6) and needs its own evidence, decision and PR. |
| **D-2** | **README mismatch** (`README.md:311`, `:335`/`:100` "均时差"; `:312` "1986–1991" and implied clock-adjust UI) | Options: (a) correct the README to describe the form path (LMT, fixed +480, no EoT) and the dormant status of `dst-cn`/`clock-adjust`; (b) change the product to match the README, which is decision D-1 for China; (c) leave as is. Recorded as a finding; not changed in Phase 0. |
| **D-3** | **Province → zone/rule mapping** (§3.6) | Approve the 18 North / 15 South / 1 split (Quảng Trị) assignment and the `vn-north`/`vn-south` rule sets. Post-1975 everything maps to `Asia/Ho_Chi_Minh`. |
| **D-4** | **Northern history gaps** (1947–Oct 1954 / May 1955; Hải Phòng day; pre-1911) | Proposed: return `unresolved` and ask the user for the clock offset, rather than adopting backzone `Asia/Hanoi`'s +08 for all of the north. Alternatives: use backzone Hanoi values for Hà Nội city only, labelled low confidence. |
| **D-5** | **Southern contested areas 1960–1975 and the 1975-06-13 hour** | Proposed: use `Asia/Ho_Chi_Minh` as tzdata does and label it "theo IANA tzdata". Show both fold candidates for 1975-06-12 23:00–23:59. |
| **D-6** | **Rounding rule for `v1`** | `legacy-v0` must not round (§2.4). For `v1`: (a) no rounding, like `share.ts`; or (b) nearest second, like `true-solar-time.ts:116`. They are identical for catalogue longitudes and differ for exact coordinates within 0.5 s of a boundary. |
| **D-7** | **EoT time base** (only if `'true'` is ever enabled) | Evaluate at the UTC instant, or keep the local clock as at `true-solar-time.ts:86-88`. |
| **D-8** | **China DST wiring** | `dst-cn.ts`/`clock-adjust.ts` are not wired into any UI in this repo (§1.3). Decide whether Phase 3 adds the user-confirmed button or keeps today's state. The model never applies DST automatically for China in any case. |
| **D-9** | **History de-duplication ignores place** (`history.ts:41-48`) | Once place affects results through offsets, two births at the same time in different places overwrite each other. Decide whether to add `locationId`/`lat`/`lon` to the key. |
| **D-10** | **Source for the 34-unit list** | Accept the LuatVietnam English transcription of Resolution 202/2025/QH15, or require the Công báo original before Phase 3. |
| **D-11** | **Pre-1906 / LMT-era births** (the form allows 1900+) | Proposed: allow them, mark `standardOffsetMinutes = null`, and show a "giờ địa phương trước 1906" warning. |

### Not verified (explicit)
- The [H3] gazette scans (cited only through tzdata).
- The hour of the 1975-06-13 change.
- The exact day Hà Nội and Hải Phòng returned to +07.
- Per-province 1954–75 control and clock usage.
- The 34-unit list against the official Vietnamese text: thuvienphapluat returned 403, and vbpl.vn returned no document.
- Vietnamese per-province longitude spans.
- How ICU on a production host differs from the local Node 22.22.3.
