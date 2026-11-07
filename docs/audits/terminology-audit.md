# Terminology audit: Chinese engine identifiers → Vietnamese Tử Vi Đẩu Số terms

Phase 0, deliverable D1. Audit only: this document and `scripts/i18n/collect-identifiers.ts` are the only files added; no existing file was changed.

## 1. Purpose, policy and status legend

This table lists every Chinese identifier the charting engine (`lib/ziwei/`, which wraps iztro run in `zh-CN`) can emit. For each one it gives the Vietnamese Tử Vi Đẩu Số term the presentation layer should display, along with the evidence for that term.

- **Engine identifiers never change.** The Chinese strings in `lib/ziwei/` stay byte-for-byte as they are. This table only drives display.
- **Specialist terms use Hán-Việt.** For example 天地人 is shown as Thiên – Địa – Nhân, never as Trời – Đất – Người. Where the Vietnamese tradition uses a name that differs from the literal Hán-Việt reading (for example 咸池 = Đào Hoa, 岁建 = Thái Tuế), the row is marked **Disputed** so you can choose.
- **No merging.** There is one row per (category, Chinese identifier). Where two identifiers would share a display term, the row says so in its note, and §7 lists the collisions.

| Status | Meaning |
|---|---|
| **Verified** | I opened the source and can cite it precisely (title plus page/section, or exact URL), and it uses this term for this concept. |
| **Disputed** | The sources conflict, or the concept has no clean Vietnamese counterpart, or the conventional Vietnamese name differs from the Hán-Việt reading. Needs your decision. |
| **Unverified** | I found no citable Vietnamese source. The Hán-Việt column is still filled in, but it is a reading, not an attested term. |

The Hán-Việt column gives character readings. Where a reading was in doubt I checked it against hvdic.thivien.net (see §6). It is never taken from iztro. The iztro vi-VN column is shown **for comparison only** and is never used as evidence.

| Reachability class | Meaning |
|---|---|
| **runtime-observed** | Seen in the sweep output; the count is the number of occurrences. |
| **declared-but-not-observed** | Present in an engine type, table or source file, but not seen in the sweep. |
| **proven-unreachable** | Never emitted, backed by a cited code argument (§5). A finite sweep alone never establishes this class. |
| **iztro-only** | Exists in iztro's locale or data, but this engine never emits it. |

## 2. Coverage statistics (produced by the script)

All numbers in this section come from the script's JSON output (`coverage`, `identifierCountsByCategory`, `reachabilityTotals`, `brightnessBySchool`, `brightnessTableValuesBySchool`).

### 2.1 Brightness schools

| Enum (`BrightnessSchool`, school-data.ts:138) | Full name from the code | Grades | Grade map |
|---|---|---|---|
| `QS` (also what `'default'` resolves to: algorithm.ts:115-119) | 全书派《紫微斗数全书》 (school-data.ts:140); UI label 《斗数全书》派, "默认 · 与主流排盘软件默认一致" (school-config.ts:230) | 7: 庙 旺 得 利 平 不 陷 | `BRIGHTNESS_NUM_TO_CN` (school-data.ts:229-231) |
| `XD1` | 现代修订亮度表（第一版）; UI label 现代修正 v1 (school-config.ts:232); comment 现代修正 1 (school-data.ts:159) | 7 (same map as QS) | `BRIGHTNESS_NUM_TO_CN` via `BRIGHTNESS_NUM_TO_CN_BY_SCHOOL` (school-data.ts:243-246) |
| `ZZ` | 中州派; UI desc 中州派理论 (school-config.ts:233); school-data.ts:178 | 5: 庙 旺 平 闲 陷 | `BRIGHTNESS_NUM_TO_CN_5` (school-data.ts:238-240) |
| `XD2` | 现代修订亮度表（第二版）; UI label 现代修正 v2 (school-config.ts:231); comment 现代修正 2 (school-data.ts:197) | 5 (same map as ZZ) | `BRIGHTNESS_NUM_TO_CN_5` via school-data.ts:243-246 |

The school is selected with `setBrightnessSchool` (algorithm.ts:117). It is global module state, and `'default'` maps to `QS` (algorithm.ts:118). In the user config it is `brightnessSchool` (school-config.ts:14, 83). The URL key is `bs` (school-config.ts:186, 191, 207). `'default'` is not written to the URL, and `bs=QS` is normalised back to `'default'` (school-config.ts:158-160).

These are places where the code disagrees with itself. They are recorded here and nothing has been changed:

- `types.ts:41` calls `StarBrightness` "8 档" and says 地 is an extra XD1 grade. In fact the union lists 9 values, and XD1 uses the 7-grade map with no 地 (school-data.ts:243-246).
- `school-data.ts:136` documents the legacy 14-star tables as "0=陷, 1=平, 2=不, 3=地, 4=利, 5=得, 6=旺, 7=庙". That is the reversed mapping which school-data.ts:226-231 says was corrected. The legacy tables `SCHOOL_BRIGHTNESS_*` (school-data.ts:141-214) feed only `schoolBrightnessTableToIztroFormat`, which nothing calls.
- `school-data.ts:159` labels XD1 "默认口径 fallback", but the default is QS (algorithm.ts:110-115).

### 2.2 Sweep definition and chart counts

- **Engine call:** `generateChart(birthInfo, { leapMonth })`, with `setBrightnessSchool(school)` set before each chart and reset to `'default'` at exit. iztro version in node_modules: **2.6.1**.
- **Charts generated:** **30,144** out of 30,240 jobs. The other 96 jobs threw (see §2.6).
- **Genders:** male, female. **时辰:** all 12 (0=子, 1=丑, 2=寅, 3=卯, 4=辰, 5=巳, 6=午, 7=未, 8=申, 9=酉, 10=戌, 11=亥).
- **Brightness schools:** QS, XD1, ZZ, XD2. **Leap policies:** split, next-month, prev-month, origin-month.
- **Policy rule:** Non-leap dates are charted under split only (leap policy is a no-op there: algorithm.ts:158-167, 486); raw-leap dates under all 4 policies.
- **Set `base-grid`:** Same dates as .claude/skills/chart/chart.ts --sweep: years 1960..2010 step 7 (1960,1967,1974,1981,1988,1995,2002,2009) × months 1,4,7,10 × days 5,15,25, plus its 8 extra dates; hours extended to all 12; both genders. 104 dates. Extra dates: 1984-2-4, 1999-2-11, 2001-5-23, 2004-3-21, 2006-8-24, 2020-5-23, 2023-3-22, 2023-4-19. Dates in this set that fall in a leap month (so they also run under all 4 policies): 1960-7-25 = 农历1960-闰6-2 (庚子年); 1995-10-5 = 农历1995-闰8-11 (乙亥年); 1995-10-15 = 农历1995-闰8-21 (乙亥年); 2009-7-5 = 农历2009-闰5-13 (己丑年); 2009-7-15 = 农历2009-闰5-23 (己丑年); 2001-5-23 = 农历2001-闰4-1 (辛巳年); 2004-3-21 = 农历2004-闰2-1 (甲申年); 2006-8-24 = 农历2006-闰7-1 (丙戌年); 2020-5-23 = 农历2020-闰4-1 (庚子年); 2023-3-22 = 农历2023-闰2-1 (癸卯年); 2023-4-19 = 农历2023-闰2-29 (癸卯年).
- **Set `leap-month`:** Leap lunar months that START between 1960-01-01 and 2033-12-31, found by scanning every solar day 1960-01-01..2034-03-31 with lunar-javascript; requested 2020闰4 / 2023闰2 / 2017闰6 first, then the first occurrence of each other leap-month number; lunar days 1, 15, 16 and last day. Leap months found: 1960-闰6, 1963-闰4, 1966-闰3, 1968-闰7, 1971-闰5, 1974-闰4, 1976-闰8, 1979-闰6, 1982-闰4, 1984-闰10, 1987-闰6, 1990-闰5, 1993-闰3, 1995-闰8, 1998-闰5, 2001-闰4, 2004-闰2, 2006-闰7, 2009-闰5, 2012-闰4, 2014-闰9, 2017-闰6, 2020-闰4, 2023-闰2, 2025-闰6, 2028-闰5, 2031-闰3, 2033-闰11. Chosen: 2020-闰4, 2023-闰2, 2017-闰6, 1966-闰3, 1968-闰7, 1971-闰5, 1976-闰8, 1984-闰10, 2014-闰9, 2033-闰11 (40 dates).

Leap-month dates, as verified by the script (lunar-javascript), with the effective lunar date each policy produces (`resolveEffectiveLunarDate`, algorithm.ts:137-203):

| Leap month | Lunar day | Solar date | Verified lunar date | split | next-month | prev-month | origin-month |
|---|---|---|---|---|---|---|---|
| 2020-闰4 | 1 | 2020-5-23 | 2020-闰4-1 (庚子年) | 2020-4-1 | 2020-5-1 | 2020-4-1 | 2020-闰4-1 |
| 2020-闰4 | 15 | 2020-6-6 | 2020-闰4-15 (庚子年) | 2020-4-15 | 2020-5-15 | 2020-4-15 | 2020-闰4-15 |
| 2020-闰4 | 16 | 2020-6-7 | 2020-闰4-16 (庚子年) | 2020-5-16 | 2020-5-16 | 2020-4-16 | 2020-闰4-16 |
| 2020-闰4 | 29 | 2020-6-20 | 2020-闰4-29 (庚子年) | 2020-5-29 | 2020-5-29 | 2020-4-29 | 2020-闰4-29 |
| 2023-闰2 | 1 | 2023-3-22 | 2023-闰2-1 (癸卯年) | 2023-2-1 | 2023-3-1 | 2023-2-1 | 2023-闰2-1 |
| 2023-闰2 | 15 | 2023-4-5 | 2023-闰2-15 (癸卯年) | 2023-2-15 | 2023-3-15 | 2023-2-15 | 2023-闰2-15 |
| 2023-闰2 | 16 | 2023-4-6 | 2023-闰2-16 (癸卯年) | 2023-3-16 | 2023-3-16 | 2023-2-16 | 2023-闰2-16 |
| 2023-闰2 | 29 | 2023-4-19 | 2023-闰2-29 (癸卯年) | 2023-3-29 | 2023-3-29 | 2023-2-29 | 2023-闰2-29 |
| 2017-闰6 | 1 | 2017-7-23 | 2017-闰6-1 (丁酉年) | 2017-6-1 | 2017-7-1 | 2017-6-1 | 2017-闰6-1 |
| 2017-闰6 | 15 | 2017-8-6 | 2017-闰6-15 (丁酉年) | 2017-6-15 | 2017-7-15 | 2017-6-15 | 2017-闰6-15 |
| 2017-闰6 | 16 | 2017-8-7 | 2017-闰6-16 (丁酉年) | 2017-7-16 | 2017-7-16 | 2017-6-16 | 2017-闰6-16 |
| 2017-闰6 | 30 | 2017-8-21 | 2017-闰6-30 (丁酉年) | 2017-7-29 | 2017-7-29 | 2017-6-29 | 2017-闰6-30 |
| 1966-闰3 | 1 | 1966-4-21 | 1966-闰3-1 (丙午年) | 1966-3-1 | 1966-4-1 | 1966-3-1 | 1966-闰3-1 |
| 1966-闰3 | 15 | 1966-5-5 | 1966-闰3-15 (丙午年) | 1966-3-15 | 1966-4-15 | 1966-3-15 | 1966-闰3-15 |
| 1966-闰3 | 16 | 1966-5-6 | 1966-闰3-16 (丙午年) | 1966-4-16 | 1966-4-16 | 1966-3-16 | 1966-闰3-16 |
| 1966-闰3 | 29 | 1966-5-19 | 1966-闰3-29 (丙午年) | 1966-4-29 | 1966-4-29 | 1966-3-29 | 1966-闰3-29 |
| 1968-闰7 | 1 | 1968-8-24 | 1968-闰7-1 (戊申年) | 1968-7-1 | 1968-8-1 | 1968-7-1 | 1968-闰7-1 |
| 1968-闰7 | 15 | 1968-9-7 | 1968-闰7-15 (戊申年) | 1968-7-15 | 1968-8-15 | 1968-7-15 | 1968-闰7-15 |
| 1968-闰7 | 16 | 1968-9-8 | 1968-闰7-16 (戊申年) | 1968-8-16 | 1968-8-16 | 1968-7-16 | 1968-闰7-16 |
| 1968-闰7 | 29 | 1968-9-21 | 1968-闰7-29 (戊申年) | 1968-8-29 | 1968-8-29 | 1968-7-29 | 1968-闰7-29 |
| 1971-闰5 | 1 | 1971-6-23 | 1971-闰5-1 (辛亥年) | 1971-5-1 | 1971-6-1 | 1971-5-1 | 1971-闰5-1 |
| 1971-闰5 | 15 | 1971-7-7 | 1971-闰5-15 (辛亥年) | 1971-5-15 | 1971-6-15 | 1971-5-15 | 1971-闰5-15 |
| 1971-闰5 | 16 | 1971-7-8 | 1971-闰5-16 (辛亥年) | 1971-6-16 | 1971-6-16 | 1971-5-16 | 1971-闰5-16 |
| 1971-闰5 | 29 | 1971-7-21 | 1971-闰5-29 (辛亥年) | 1971-6-29 | 1971-6-29 | 1971-5-29 | 1971-闰5-29 |
| 1976-闰8 | 1 | 1976-9-24 | 1976-闰8-1 (丙辰年) | 1976-8-1 | 1976-9-1 | 1976-8-1 | 1976-闰8-1 |
| 1976-闰8 | 15 | 1976-10-8 | 1976-闰8-15 (丙辰年) | 1976-8-15 | 1976-9-15 | 1976-8-15 | 1976-闰8-15 |
| 1976-闰8 | 16 | 1976-10-9 | 1976-闰8-16 (丙辰年) | 1976-9-16 | 1976-9-16 | 1976-8-16 | 1976-闰8-16 |
| 1976-闰8 | 29 | 1976-10-22 | 1976-闰8-29 (丙辰年) | 1976-9-29 | 1976-9-29 | 1976-8-29 | 1976-闰8-29 |
| 1984-闰10 | 1 | 1984-11-23 | 1984-闰10-1 (甲子年) | 1984-10-1 | 1984-11-1 | 1984-10-1 | 1984-闰10-1 |
| 1984-闰10 | 15 | 1984-12-7 | 1984-闰10-15 (甲子年) | 1984-10-15 | 1984-11-15 | 1984-10-15 | 1984-闰10-15 |
| 1984-闰10 | 16 | 1984-12-8 | 1984-闰10-16 (甲子年) | 1984-11-16 | 1984-11-16 | 1984-10-16 | 1984-闰10-16 |
| 1984-闰10 | 29 | 1984-12-21 | 1984-闰10-29 (甲子年) | 1984-11-29 | 1984-11-29 | 1984-10-29 | 1984-闰10-29 |
| 2014-闰9 | 1 | 2014-10-24 | 2014-闰9-1 (甲午年) | 2014-9-1 | 2014-10-1 | 2014-9-1 | 2014-闰9-1 |
| 2014-闰9 | 15 | 2014-11-7 | 2014-闰9-15 (甲午年) | 2014-9-15 | 2014-10-15 | 2014-9-15 | 2014-闰9-15 |
| 2014-闰9 | 16 | 2014-11-8 | 2014-闰9-16 (甲午年) | 2014-10-16 | 2014-10-16 | 2014-9-16 | 2014-闰9-16 |
| 2014-闰9 | 29 | 2014-11-21 | 2014-闰9-29 (甲午年) | 2014-10-29 | 2014-10-29 | 2014-9-29 | 2014-闰9-29 |
| 2033-闰11 | 1 | 2033-12-22 | 2033-闰11-1 (癸丑年) | 2033-11-1 | 2033-12-1 | 2033-11-1 | 2033-闰11-1 |
| 2033-闰11 | 15 | 2034-1-5 | 2033-闰11-15 (癸丑年) | 2033-11-15 | 2033-12-15 | 2033-11-15 | 2033-闰11-15 |
| 2033-闰11 | 16 | 2034-1-6 | 2033-闰11-16 (癸丑年) | 2033-12-16 | 2033-12-16 | 2033-11-16 | 2033-闰11-16 |
| 2033-闰11 | 29 | 2034-1-19 | 2033-闰11-29 (癸丑年) | 2033-12-29 | 2033-12-29 | 2033-11-29 | 2033-闰11-29 |

Boundary and special cases (set `boundary`, all 12 hours × 2 genders × 4 schools, policy `split`):

| Solar date | Lunar date | Why |
|---|---|---|
| 1999-2-4 | 1998-12-19 (戊寅年) | 立春 day (1999-02-04), before 正月初一 |
| 1999-2-11 | 1998-12-26 (戊寅年) | after 立春, before 正月初一 (1999-02-16): still 戊寅 lunar year |
| 1999-2-16 | 1999-1-1 (己卯年) | 正月初一 1999 (己卯 lunar year starts) |
| 2004-2-4 | 2004-1-14 (甲申年) | 立春 day 2004 (立春 at 19:56; regression in sizhu-lichun-boundary) |
| 1984-2-2 | 1984-1-1 (甲子年) | 正月初一 1984 (甲子) |
| 1990-1-31 | 1990-1-5 (庚午年) | month end (31) |
| 1990-2-28 | 1990-2-4 (庚午年) | month end, non-leap February |
| 1996-2-29 | 1996-1-11 (丙子年) | month end, leap-year February 29 |
| 2000-2-29 | 2000-1-25 (庚辰年) | month end, century leap-year February 29 |
| 1990-4-30 | 1990-4-6 (庚午年) | month end (30) |
| 1989-12-31 | 1989-12-4 (己巳年) | year end |
| 1990-1-1 | 1989-12-5 (己巳年) | year start |
| 1999-12-31 | 1999-11-24 (己卯年) | year end (millennium) |
| 2000-1-1 | 1999-11-25 (己卯年) | year start (millennium) |
| 2010-12-31 | 2010-11-26 (庚寅年) | year end (end of grid range) |
| 1960-1-1 | 1959-12-3 (己亥年) | year start (start of grid range) |
| 1990-5-10 (from 1990-5-9 23:30 @120°E (form path, late 子时)) | 1990-4-16 (庚午年) | late 子时 day change: charting day 1990-5-10, branch 子 |
| 2000-1-1 (from 1999-12-31 23:30 @120°E (form path, late 子时)) | 1999-11-25 (己卯年) | late 子时 day change: charting day 2000-1-1, branch 子 |
| 2000-2-29 (from 2000-2-28 23:30 @120°E (form path, late 子时)) | 2000-1-25 (庚辰年) | late 子时 day change: charting day 2000-2-29, branch 子 |
| 1990-2-1 (from 1990-1-31 23:30 @120°E (form path, late 子时)) | 1990-1-6 (庚午年) | late 子时 day change: charting day 1990-2-1, branch 子 |

The boundary set has 18 distinct charting dates, because two late-子时 cases land on dates already in the fixed list. The late-子时 rows go through the real form path (`formToBirthInfo`, share.ts:21-48), at longitude 120°E, so no true-solar shift applies.

Charts per set × school × leap policy:

| Set | School | split | next-month | prev-month | origin-month |
|---|---|---|---|---|---|
| base-grid | QS | 2496 | 264 | 264 | 264 |
| base-grid | XD1 | 2496 | 264 | 264 | 264 |
| base-grid | ZZ | 2496 | 264 | 264 | 264 |
| base-grid | XD2 | 2496 | 264 | 264 | 264 |
| leap-month | QS | 960 | 960 | 960 | 936 |
| leap-month | XD1 | 960 | 960 | 960 | 936 |
| leap-month | ZZ | 960 | 960 | 960 | 936 |
| leap-month | XD2 | 960 | 960 | 960 | 936 |
| boundary | QS | 432 | 0 | 0 | 0 |
| boundary | XD1 | 432 | 0 | 0 | 0 |
| boundary | ZZ | 432 | 0 | 0 | 0 |
| boundary | XD2 | 432 | 0 | 0 | 0 |

Charts per school × leap policy (all sets):

| School | split | next-month | prev-month | origin-month | total |
|---|---|---|---|---|---|
| QS | 3888 | 1224 | 1224 | 1200 | 7,536 |
| XD1 | 3888 | 1224 | 1224 | 1200 | 7,536 |
| ZZ | 3888 | 1224 | 1224 | 1200 | 7,536 |
| XD2 | 3888 | 1224 | 1224 | 1200 | 7,536 |


### 2.3 Identifier counts by category and reachability

| Category | Rows | runtime-observed | declared-but-not-observed | proven-unreachable | iztro-only |
|---|---|---|---|---|---|
| star | 74 | 70 | 0 | 2 | 2 |
| flowStar | 50 | 0 | 0 | 0 | 50 |
| changsheng12 | 12 | 0 | 0 | 0 | 12 |
| palace | 25 | 12 | 11 | 0 | 2 |
| brightness | 9 | 8 | 0 | 1 | 0 |
| sihua | 4 | 4 | 0 | 0 | 0 |
| sihuaCompound | 4 | 0 | 4 | 0 | 0 |
| stem | 10 | 10 | 0 | 0 | 0 |
| branch | 12 | 12 | 0 | 0 | 0 |
| shichen | 12 | 0 | 12 | 0 | 0 |
| wuxingJu | 5 | 5 | 0 | 0 | 0 |
| yinYangGender | 4 | 4 | 0 | 0 | 0 |
| shierShen.boshi | 13 | 12 | 0 | 0 | 1 |
| shierShen.suiqian | 12 | 12 | 0 | 0 | 0 |
| shierShen.jiangqian | 12 | 12 | 0 | 0 | 0 |
| yunxianLabel | 8 | 0 | 8 | 0 | 0 |
| pattern | 44 | 44 | 0 | 0 | 0 |
| patternTemplate | 3 | 3 | 0 | 0 | 0 |
| mingGongSummary.nature | 14 | 14 | 0 | 0 | 0 |
| concept | 1 | 0 | 0 | 1 | 0 |
| **Total** | **328** | **222** | **35** | **4** | **67** |

### 2.4 Other observed values

- 命主 values observed (7): 巨门 (5,024), 廉贞 (5,024), 文曲 (5,024), 武曲 (5,024), 禄存 (5,024), 破军 (2,512), 贪狼 (2,512). Each is a star name; terminology is in §4.1.
- 身主 values observed (6): 火星 (9,888), 天同 (5,184), 天机 (4,224), 天相 (4,032), 天梁 (3,648), 文昌 (3,168). Each is a star name; terminology is in §4.1.
- `daXians[].siHua` populated: 0 times; `Palace.selfSihua` populated: 0 times (both fields are never set by `generateChart`, see §5).
- Distinct 干支 pairs seen in `lunarInfo.fourPillars`/`fourPillarsLunar`: 60 of 60. They are compositional (stem + branch rows in §4.8–4.9), so they get no rows of their own.
- First 大限 start age distribution: 2: 6,192, 3: 6,176, 4: 5,600, 5: 5,936, 6: 6,240.

### 2.5 Brightness observed per school, against what each school's table can produce

"Observed" counts star-instances in the sweep. "Table cells" counts the non-zero cells of `SCHOOL_AX.SB_<school>` for the stars in `SCHOOL_STAR_ID_TO_NAME`, mapped through that school's grade map. That is what the school *can* emit, independent of the sweep.

| Grade | QS observed | XD1 observed | ZZ observed | XD2 observed | QS table cells | XD1 table cells | ZZ table cells | XD2 table cells |
|---|---|---|---|---|---|---|---|---|
| 庙 | 137,880 | 135,120 | 137,452 | 138,940 | 189 | 187 | 191 | 202 |
| 旺 | 73,276 | 75,788 | 90,708 | 99,696 | 106 | 108 | 127 | 143 |
| 得 | 24,012 | 23,652 | 0 | 0 | 36 | 36 | 0 | 0 |
| 利 | 14,320 | 13,736 | 0 | 0 | 22 | 29 | 0 | 0 |
| 平 | 87,468 | 90,492 | 102,388 | 99,124 | 118 | 123 | 138 | 136 |
| 不 | 16,708 | 15,400 | 0 | 0 | 22 | 19 | 0 | 0 |
| 闲 | 0 | 0 | 20,692 | 12,000 | 0 | 0 | 31 | 17 |
| 陷 | 96,960 | 96,436 | 99,384 | 102,400 | 119 | 118 | 125 | 128 |
| 地 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

- 得/利/不 are emitted only by QS and XD1, and 闲 only by ZZ and XD2. This follows from the grade maps (school-data.ts:229-246), not just from the sweep.
- No school's table maps to 地. See §5.

### 2.6 Errors during the sweep (an engine finding, not changed in Phase 0)

- `leap-month 2017-8-21 leapMonth=origin-month: only 29 days in lunar year 2017 month 6` — 96 charts

2017-08-21 is 农历 2017 闰六月三十. Under `origin-month` the engine keeps the leap flag and calls `astro.byLunar('2017-6-30', …, isLeapMonth=true)` (algorithm.ts:486-496). iztro rejects day 30, apparently checking the length of the regular sixth month (29 days), so `generateChart` throws for every hour, gender and school. The clamp at algorithm.ts:188-193 does not prevent this because lunar-javascript reports 30 days for 闰六月. The other three policies chart this date normally. You can reproduce it with `npx tsx .claude/skills/chart/chart.ts --date 2017-08-21 --hour 3 --gender male --leap origin-month`.

## 3. How to reproduce

From the repository root:

```bash
npx tsx scripts/i18n/collect-identifiers.ts --out /tmp/identifiers.json
# --workers N (default: min(10, CPUs-1)) only changes speed; the JSON is identical for any N.
```

The script is read-only and deterministic: no timestamps, sorted keys, and counts that are independent of the worker split. It forks worker processes that each run a slice of the same job list. On the machine used for this audit (12 cores, 10 workers) it took 68 s of wall-clock time (648 s of CPU) for 30,144 charts; with `--workers 5` it took 109 s. Both runs produced byte-identical JSON. The Tử Vi terminology columns below were researched by hand and are not produced by the script.

## 4. Identifier tables

There are 328 rows in total. In the Reference column, "TTL p.N §x" means the printed page and section of *Tử Vi Đẩu Số Tân Biên*. TVNL, KL, LQL and HV are defined in §6. "not found" means I searched all four Vietnamese books for that term (and its obvious variants) and found no hit.

### 4.1 Stars emitted in `Palace.stars[].name` (plus iztro-only and unreachable star names)

Every observed star appeared in every one of the charts (each count equals the chart total), because iztro places the full star set on every chart.

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 七杀 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Thất Sát | Thất Sát | TTL p.9 §8.2 | **Verified** | Thất Sát | runtime-observed (30,144) |
| 三台 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Tam Thai | Tam Thai | TTL p.12 §8.12 | **Verified** | Tam Thai | runtime-observed (30,144) |
| 八座 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Bát Tọa | Bát Tọa | TTL p.12 §8.12 | **Verified** | Bát Tọa | runtime-observed (30,144) |
| 凤阁 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555. Note: iztro writes the variant "Phụng Các". | Phượng Các | Phượng Các | TTL p.11 §8.9 | **Verified** | Phụng Các | runtime-observed (30,144) |
| 副截 | second palace of the 截空 pair (renamed from iztro 空亡, algorithm.ts:417; brightness row alias school-data.ts:282). Note: Repo-specific name. Collides with 截空 if both are shown as "Triệt". | Phó Tiệt (副 = phó) | none (Triệt covers both palaces) | TTL p.17; KL p.67 (Triệt placed between two palaces; no separate second star) | **Disputed** | — | runtime-observed (30,144) |
| 副旬 | second palace of the 旬空 pair pushed by applySchoolFuxun (algorithm.ts:445-451). Note: Repo-specific name. Collides with 旬空 if both are shown as "Tuần". | Phó Tuần | none (Tuần covers both palaces) | TTL p.17; KL pp.67-68 | **Disputed** | — | runtime-observed (30,144) |
| 劫煞 | year-branch star pushed from iztro jiangqian12 (algorithm.ts:562-566). Note: Same string as 将前十二神 #6. iztro also has adjective "劫杀" (iztro-only) that renders as Kiếp Sát too. | Kiếp Sát | Kiếp Sát | TTL p.15 §8.28 (placement table identical: 申子辰→巳 …) | **Verified** | Kiếp Sát | runtime-observed (30,144) |
| 华盖 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555. Note: Same string as 将前十二神 #5 (same placement rule). | Hoa Cái | Hoa Cái | TTL p.15 §8.30 | **Verified** | Hoa Cái | runtime-observed (30,144) |
| 台辅 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555. Note: iztro: "Đài Phụ". | Thai Phụ / Đài Phụ (台 = thai, đài) | Thai Phụ | TTL p.13 §8.19 | **Verified** | Đài Phụ | runtime-observed (30,144) |
| 右弼 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Hữu Bật | Hữu Bật | TTL p.11 §8.7 | **Verified** | Hữu Bật | runtime-observed (30,144) |
| 咸池 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555; same string as 将前十二神 #10. Note: The Vietnamese tradition names this star Đào Hoa; the Hán-Việt reading is Hàm Trì. Decide whether to display the conventional name. | Hàm Trì | Đào Hoa (by placement) | TTL pp.14-15 §8.26 "Đào Hoa" (placement table identical to 咸池: 申子辰→酉, 寅午戌→卯, 巳酉丑→午, 亥卯未→子; cf. school-data.ts:362 SCHOOL_XIANCHI); "Hàm Trì" not found in TTL/TVNL/KL/LQL | **Disputed** | Hàm Trì | runtime-observed (30,144) |
| 地劫 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Địa Kiếp | Địa Kiếp | TTL p.10 §8.6.2 | **Verified** | Địa Kiếp | runtime-observed (30,144) |
| 地空 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Địa Không | Địa Không | TTL p.10 §8.6.2 | **Verified** | Địa Không | runtime-observed (30,144) |
| 大耗 | year-branch 大耗 pushed by applySchoolDahao (algorithm.ts:381-405), NOT the 博士 ring member. Note: Display collision: the engine emits both this year-branch 大耗 star and the 博士 ring 大耗; Vietnamese literature has only the ring star. Needs a disambiguating label. | Đại Hao | Đại Hao | TTL p.10 §8.4 knows Đại Hao only as Bác Sĩ ring #10 | **Disputed** | Đại Hao | runtime-observed (30,144) |
| 天伤 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Thương | Thiên Thương | TTL p.13 §8.21 | **Verified** | Thiên Thương | runtime-observed (30,144) |
| 天使 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Sứ | Thiên Sứ | TTL p.13 §8.21 | **Verified** | Thiên Sứ | runtime-observed (30,144) |
| 天刑 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Hình | Thiên Hình | TTL p.12 §8.15 | **Verified** | Thiên Hình | runtime-observed (30,144) |
| 天厨 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Trù | Thiên Trù | TTL p.16 §8.32 | **Verified** | Thiên Trù | runtime-observed (30,144) |
| 天同 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Thiên Đồng | Thiên Đồng | TTL p.7 §8.1 | **Verified** | Thiên Đồng | runtime-observed (30,144) |
| 天哭 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Khốc | Thiên Khốc | TTL p.11-12 §8.11 | **Verified** | Thiên Khốc | runtime-observed (30,144) |
| 天喜 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Hỉ / Thiên Hỷ | Thiên Hỷ | TTL p.12 §8.16 | **Verified** | Thiên Hỷ | runtime-observed (30,144) |
| 天姚 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555. Note: "Riêu" is the traditional Tử Vi reading (not a dictionary reading of 姚); "Diêu" is the dictionary Hán-Việt. iztro: Thiên Diêu. | Thiên Diêu (姚 = dao, diêu; HV) | Thiên Riêu / Thiên Diêu | TTL p.12 §8.15 "Thiên Riêu"; LQL vol.1 p.18 "Thiên Diêu"; HV 姚 | **Disputed** | Thiên Diêu | runtime-observed (30,144) |
| 天官 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Quan | Thiên Quan (Quý Nhân) | TTL p.14 §8.24 | **Verified** | Thiên Quan | runtime-observed (30,144) |
| 天寿 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Thọ | Thiên Thọ | TTL p.13 §8.20 | **Verified** | Thiên Thọ | runtime-observed (30,144) |
| 天巫 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Vu | — (not found) | not found in TTL, TVNL, KL, LQL | **Unverified** | Thiên Vu | runtime-observed (30,144) |
| 天府 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Thiên Phủ | Thiên Phủ | TTL p.9 §8.2 | **Verified** | Thiên Phủ | runtime-observed (30,144) |
| 天德 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555. Note: Same Chinese string as 岁前十二神 #10 (see that row). | Thiên Đức | Thiên Đức | TTL p.12 §8.14 | **Verified** | Thiên Đức | runtime-observed (30,144) |
| 天才 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Tài | Thiên Tài | TTL p.13 §8.20 | **Verified** | Thiên Tài | runtime-observed (30,144) |
| 天月 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555. Note: Display collision risk: iztro vi renders the flow stars 月钺/日钺/时钺 as "Thiên Nguyệt(M/d/H)". | Thiên Nguyệt | — (not found) | not found in TTL, TVNL, KL, LQL | **Unverified** | Thiên Nguyệt | runtime-observed (30,144) |
| 天机 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Thiên Cơ | Thiên Cơ | TTL p.7 §8.1 | **Verified** | Thiên Cơ | runtime-observed (30,144) |
| 天梁 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Thiên Lương | Thiên Lương | TTL p.9 §8.2 | **Verified** | Thiên Lương | runtime-observed (30,144) |
| 天相 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Thiên Tướng | Thiên Tướng | TTL p.9 §8.2 | **Verified** | Thiên Tướng | runtime-observed (30,144) |
| 天福 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Phúc | Thiên Phúc (Quý Nhân) | TTL p.14 §8.24 | **Verified** | Thiên Phúc | runtime-observed (30,144) |
| 天空 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Không | Thiên Không | TTL p.16 §8.36 | **Verified** | Thiên Không | runtime-observed (30,144) |
| 天虚 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Hư | Thiên Hư | TTL p.12 §8.11 | **Verified** | Thiên Hư | runtime-observed (30,144) |
| 天贵 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Thiên Quý | Thiên Quý | TTL p.12 §8.13 | **Verified** | Thiên Quý | runtime-observed (30,144) |
| 天钺 | auxiliary star, iztro minorStars → algorithm.ts:529-539. Note: Natal 天钺 only; must stay distinct from flow 运钺/流钺/月钺/日钺/时钺 (see special-care). | Thiên Việt | Thiên Việt | TTL p.11 §8.10 | **Verified** | Thiên Việt | runtime-observed (30,144) |
| 天马 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Thiên Mã | Thiên Mã | TTL p.15 §8.27 | **Verified** | Thiên Mã | runtime-observed (30,144) |
| 天魁 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Thiên Khôi | Thiên Khôi | TTL p.11 §8.10 | **Verified** | Thiên Khôi | runtime-observed (30,144) |
| 太阳 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Thái Dương | Thái Dương | TTL p.7 §8.1 | **Verified** | Thái Dương | runtime-observed (30,144) |
| 太阴 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Thái Âm | Thái Âm | TTL p.9 §8.2 | **Verified** | Thái Âm | runtime-observed (30,144) |
| 孤辰 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Cô Thần | Cô Thần | TTL p.14 §8.25 | **Verified** | Cô Thần | runtime-observed (30,144) |
| 寡宿 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Quả Tú | Quả Tú | TTL p.14 §8.25 | **Verified** | Quả Tú | runtime-observed (30,144) |
| 封诰 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Phong Cáo | Phong Cáo | TTL p.13 §8.19 | **Verified** | Phong Cáo | runtime-observed (30,144) |
| 左辅 | auxiliary star, iztro minorStars → algorithm.ts:529-539. Note: Two spellings in the literature (same book uses both). iztro: Tả Phù. Needs an orthography decision. | Tả Phụ (辅 = phụ, HV) | Tả Phụ / Tả Phù | TTL p.11 §8.7 "Tả Phụ"; TTL p.272-273 sample charts and TVNL use "Tả Phù"; HV 辅 | **Disputed** | Tả Phù | runtime-observed (30,144) |
| 巨门 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Cự Môn | Cự Môn | TTL p.9 §8.2 | **Verified** | Cự Môn | runtime-observed (30,144) |
| 年解 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555. Note: Same name is also an iztro yearly horoscope star (horoscopeStar.js:101); only the natal one is emitted. | Niên Giải | — (not found) | not found in TTL, TVNL, KL, LQL | **Unverified** | Niên Giải | runtime-observed (30,144) |
| 廉贞 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Liêm Trinh | Liêm Trinh | TTL p.7 §8.1 | **Verified** | Liêm Trinh | runtime-observed (30,144) |
| 恩光 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Ân Quang | Ân Quang | TTL p.12 §8.13 | **Verified** | Ân Quang | runtime-observed (30,144) |
| 截空 | first palace of the 截空 pair after rename 截路→截空 (algorithm.ts:413-443). Note: Vietnamese draws one Triệt spanning both palaces; the engine emits two stars (截空 + 副截). See special-care. | Tiệt Không (截 = tiệt, HV) | Triệt (Triệt Lộ không vong) | TTL pp.16-17 §8.37.2; KL p.67 "An Triệt giữa hai cung"; HV 截 | **Verified** | Triệt Không | runtime-observed (30,144) |
| 擎羊 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Kình Dương | Kình Dương | TTL p.10 §8.6.1 | **Verified** | Kình Dương | runtime-observed (30,144) |
| 文昌 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Văn Xương | Văn Xương | TTL p.11 §8.8 | **Verified** | Văn Xương | runtime-observed (30,144) |
| 文曲 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Văn Khúc | Văn Khúc | TTL p.11 §8.8 | **Verified** | Văn Khúc | runtime-observed (30,144) |
| 旬空 | first palace of the 旬空 pair (iztro xunkong; brightness row alias school-data.ts:282). Note: See special-care 副旬/副截. | Tuần Không | Tuần (Tuần Trung không vong) | TTL pp.16-17 §8.37.1; KL pp.67-68 "An Tuần giữa hai cung" | **Verified** | Tuần Không | runtime-observed (30,144) |
| 月德 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Nguyệt Đức | Nguyệt Đức | TTL p.12 §8.14 | **Verified** | Nguyệt Đức | runtime-observed (30,144) |
| 武曲 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Vũ Khúc | Vũ Khúc | TTL p.7 §8.1 | **Verified** | Vũ Khúc | runtime-observed (30,144) |
| 火星 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Hỏa Tinh | Hỏa Tinh | TTL p.10 §8.6.3 | **Verified** | Hỏa Tinh | runtime-observed (30,144) |
| 破军 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Phá Quân | Phá Quân | TTL p.9 §8.2 | **Verified** | Phá Quân | runtime-observed (30,144) |
| 破碎 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Phá Toái | Phá Toái | TTL p.15 §8.29 | **Verified** | Phá Toái | runtime-observed (30,144) |
| 禄存 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Lộc Tồn | Lộc Tồn | TTL p.9 §8.4 | **Verified** | Lộc Tồn | runtime-observed (30,144) |
| 紫微 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Tử Vi | Tử Vi | TTL p.7 §8.1 | **Verified** | Tử Vi | runtime-observed (30,144) |
| 红鸾 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Hồng Loan | Hồng Loan | TTL p.12 §8.16 | **Verified** | Hồng Loan | runtime-observed (30,144) |
| 蜚廉 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555. Note: Display collision with 博士 ring 飞廉 (Phi Liêm). iztro: Phi Liêm. | Phi Liêm / Phỉ Liêm (蜚 = phi, phỉ; HV) | — (Vietnamese Phi Liêm is the 博士 ring star 飞廉) | TTL p.10 §8.4 (Phi Liêm = Bác Sĩ ring #7 only); HV 蜚 | **Disputed** | Phi Liêm | runtime-observed (30,144) |
| 解神 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555. Note: Name matches; TTL places Giải Thần with Phượng Các, while the engine (iztro/school tables) places 解神 by birth month — same name, different placement rule. | Giải Thần | Giải Thần | TTL p.13 §8.18 | **Verified** | Giải Thần | runtime-observed (30,144) |
| 贪狼 | major star (主星), iztro majorStars → algorithm.ts:517-527 | Tham Lang | Tham Lang | TTL p.9 §8.2 | **Verified** | Tham Lang | runtime-observed (30,144) |
| 铃星 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Linh Tinh | Linh Tinh | TTL p.10 §8.6.3 | **Verified** | Linh Tinh | runtime-observed (30,144) |
| 阴煞 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Âm Sát | — (not found) | not found in TTL, TVNL, KL, LQL | **Unverified** | Âm Sát | runtime-observed (30,144) |
| 陀罗 | auxiliary star, iztro minorStars → algorithm.ts:529-539 | Đà La | Đà La | TTL p.10 §8.6.1 | **Verified** | Đà La | runtime-observed (30,144) |
| 龙德 | pushed from iztro suiqian12 (algorithm.ts:562-566) = 岁前十二神 #8 | Long Đức | Long Đức | TTL p.9 §8.3 (Thái Tuế ring #8) | **Verified** | Long Đức | runtime-observed (30,144) |
| 龙池 | minor/misc star (杂曜), iztro adjectiveStars → algorithm.ts:544-555 | Long Trì | Long Trì | TTL p.11 §8.9 | **Verified** | Long Trì | runtime-observed (30,144) |
| 截路 | iztro name of the 截空 star; always renamed (algorithm.ts:416). Note: Never displayed (proven-unreachable). | Tiệt Lộ | Triệt Lộ (không vong) | TTL p.16 §8.37 "Triệt Lộ không vong (Triệt)" | **Verified** | Triệt Lộ | proven-unreachable (see §5) |
| 空亡 | iztro name of the 2nd 截空 star; always renamed to 副截 (algorithm.ts:417). Note: Never displayed (proven-unreachable). | Không Vong | — (only as suffix "không vong" in Tuần/Triệt names) | TTL p.16 (suffix only) | **Unverified** | Không Vong | proven-unreachable (see §5) |
| 劫杀 | iztro adjective jieshaAdj; never emitted by this engine. Note: Display collision with 劫煞 if ever shown. | Kiếp Sát (杀 = sát) | — (renders identically to 劫煞) | — | **Unverified** | Kiếp Sát | iztro-only |
| 旬中 | iztro star key xunzhong; never emitted | Tuần Trung | Tuần Trung (không vong) | TTL p.16 §8.37 "Tuần Trung không vong (Tuần)" | **Verified** | Tuần Trung | iztro-only |

### 4.2 iztro flow (运限) stars — never emitted by this engine

All rows here are iztro-only: `algorithm.ts:591-592` calls `astrolabe.horoscope()` only to read `age.nominalAge`; no other file imports iztro (`grep` over app/, components/, lib/, scripts/). The iztro vi-VN column shows iztro's own rendering, including its mistakes.

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 日喜 | daily 流日 flow star for Thiên Hỷ (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nhật Hỷ | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Hỷ(d) | iztro-only |
| 日昌 | daily 流日 flow star for Văn Xương (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nhật Xương | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Văn Xương(d) | iztro-only |
| 日曲 | daily 流日 flow star for Văn Khúc (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nhật Khúc | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Văn Khúc(d) | iztro-only |
| 日禄 | daily 流日 flow star for Lộc Tồn (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nhật Lộc | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Lộc Tồn(d) | iztro-only |
| 日羊 | daily 流日 flow star for Kình Dương (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nhật Dương | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Kình Dương(d) | iztro-only |
| 日钺 | daily 流日 flow star for Thiên Việt (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592). Note: Must not collapse into natal Thiên Việt (天钺). iztro vi for 月钺/日钺/时钺 is "Thiên Nguyệt(M/d/H)" — a mistranslation (钺 = việt) that collides with 天月. | Nhật Việt | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Nguyệt(d) | iztro-only |
| 日陀 | daily 流日 flow star for Đà La (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nhật Đà | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Đà La(d) | iztro-only |
| 日马 | daily 流日 flow star for Thiên Mã (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nhật Mã | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Mã(d) | iztro-only |
| 日魁 | daily 流日 flow star for Thiên Khôi (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nhật Khôi | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Khôi(d) | iztro-only |
| 日鸾 | daily 流日 flow star for Hồng Loan (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nhật Loan | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Hồng Loan(d) | iztro-only |
| 时喜 | hourly 流时 flow star for Thiên Hỷ (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Thời / Thì Hỷ | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Hỷ(H) | iztro-only |
| 时昌 | hourly 流时 flow star for Văn Xương (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Thời / Thì Xương | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Văn Xương(H) | iztro-only |
| 时曲 | hourly 流时 flow star for Văn Khúc (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Thời / Thì Khúc | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Văn Khúc(H) | iztro-only |
| 时禄 | hourly 流时 flow star for Lộc Tồn (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Thời / Thì Lộc | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Lộc Tồn(H) | iztro-only |
| 时羊 | hourly 流时 flow star for Kình Dương (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Thời / Thì Dương | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Kình Dương(H) | iztro-only |
| 时钺 | hourly 流时 flow star for Thiên Việt (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592). Note: Must not collapse into natal Thiên Việt (天钺). iztro vi for 月钺/日钺/时钺 is "Thiên Nguyệt(M/d/H)" — a mistranslation (钺 = việt) that collides with 天月. | Thời / Thì Việt | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Nguyệt(H) | iztro-only |
| 时陀 | hourly 流时 flow star for Đà La (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Thời / Thì Đà | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Đà La(H) | iztro-only |
| 时马 | hourly 流时 flow star for Thiên Mã (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Thời / Thì Mã | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Mã(H) | iztro-only |
| 时魁 | hourly 流时 flow star for Thiên Khôi (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Thời / Thì Khôi | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Khôi(H) | iztro-only |
| 时鸾 | hourly 流时 flow star for Hồng Loan (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Thời / Thì Loan | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Hồng Loan(H) | iztro-only |
| 月喜 | monthly 流月 flow star for Thiên Hỷ (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nguyệt Hỷ | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Hỷ(M) | iztro-only |
| 月昌 | monthly 流月 flow star for Văn Xương (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nguyệt Xương | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Văn Xương(M) | iztro-only |
| 月曲 | monthly 流月 flow star for Văn Khúc (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nguyệt Khúc | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Văn Khúc(M) | iztro-only |
| 月禄 | monthly 流月 flow star for Lộc Tồn (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nguyệt Lộc | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Lộc Tồn(M) | iztro-only |
| 月羊 | monthly 流月 flow star for Kình Dương (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nguyệt Dương | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Kình Dương(M) | iztro-only |
| 月钺 | monthly 流月 flow star for Thiên Việt (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592). Note: Must not collapse into natal Thiên Việt (天钺). iztro vi for 月钺/日钺/时钺 is "Thiên Nguyệt(M/d/H)" — a mistranslation (钺 = việt) that collides with 天月. | Nguyệt Việt | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Nguyệt(M) | iztro-only |
| 月陀 | monthly 流月 flow star for Đà La (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nguyệt Đà | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Đà La(M) | iztro-only |
| 月马 | monthly 流月 flow star for Thiên Mã (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nguyệt Mã | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Mã(M) | iztro-only |
| 月魁 | monthly 流月 flow star for Thiên Khôi (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nguyệt Khôi | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Thiên Khôi(M) | iztro-only |
| 月鸾 | monthly 流月 flow star for Hồng Loan (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Nguyệt Loan | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Hồng Loan(M) | iztro-only |
| 流喜 | yearly 流年 flow star for Thiên Hỷ (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Lưu Hỷ | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Lưu Hỷ | iztro-only |
| 流昌 | yearly 流年 flow star for Văn Xương (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Lưu Xương | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Lưu Xương | iztro-only |
| 流曲 | yearly 流年 flow star for Văn Khúc (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Lưu Khúc | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Lưu Khúc | iztro-only |
| 流禄 | yearly 流年 flow star for Lộc Tồn (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Lưu Lộc | Lưu Lộc Tồn | TTL pp.267-269 (Phần 3 §4) "Lưu Lộc Tồn, Lưu Kình Dương, Lưu Đà La … Lưu Thiên Mã" | **Verified** | Lưu Lộc | iztro-only |
| 流羊 | yearly 流年 flow star for Kình Dương (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Lưu Dương | Lưu Kình Dương | TTL pp.267-269 (Phần 3 §4) "Lưu Lộc Tồn, Lưu Kình Dương, Lưu Đà La … Lưu Thiên Mã" | **Verified** | Lưu Dương | iztro-only |
| 流钺 | yearly 流年 flow star for Thiên Việt (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592). Note: Must not collapse into natal Thiên Việt (天钺). | Lưu Việt | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Lưu Việt | iztro-only |
| 流陀 | yearly 流年 flow star for Đà La (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Lưu Đà | Lưu Đà La | TTL pp.267-269 (Phần 3 §4) "Lưu Lộc Tồn, Lưu Kình Dương, Lưu Đà La … Lưu Thiên Mã" | **Verified** | Lưu Đà | iztro-only |
| 流马 | yearly 流年 flow star for Thiên Mã (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Lưu Mã | Lưu Thiên Mã | TTL pp.267-269 (Phần 3 §4) "Lưu Lộc Tồn, Lưu Kình Dương, Lưu Đà La … Lưu Thiên Mã" | **Verified** | Lưu Mã | iztro-only |
| 流魁 | yearly 流年 flow star for Thiên Khôi (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Lưu Khôi | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Lưu Khôi | iztro-only |
| 流鸾 | yearly 流年 flow star for Hồng Loan (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Lưu Loan | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Lưu Loan | iztro-only |
| 运喜 | decadal 大限 flow star for Thiên Hỷ (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Vận Hỷ | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Vận Hỷ | iztro-only |
| 运昌 | decadal 大限 flow star for Văn Xương (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Vận Xương | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Vận Xương | iztro-only |
| 运曲 | decadal 大限 flow star for Văn Khúc (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Vận Khúc | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Vận Khúc | iztro-only |
| 运禄 | decadal 大限 flow star for Lộc Tồn (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Vận Lộc | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Vận Lộc | iztro-only |
| 运羊 | decadal 大限 flow star for Kình Dương (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Vận Dương | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Vận Dương | iztro-only |
| 运钺 | decadal 大限 flow star for Thiên Việt (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592). Note: Must not collapse into natal Thiên Việt (天钺). | Vận Việt | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Vận Việt | iztro-only |
| 运陀 | decadal 大限 flow star for Đà La (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Vận Đà | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Vận Đà | iztro-only |
| 运马 | decadal 大限 flow star for Thiên Mã (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Vận Mã | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Vận Mã | iztro-only |
| 运魁 | decadal 大限 flow star for Thiên Khôi (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Vận Khôi | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Vận Khôi | iztro-only |
| 运鸾 | decadal 大限 flow star for Hồng Loan (iztro horoscopeStar.js:38-87); this repo only reads horoscope().age.nominalAge (algorithm.ts:591-592) | Vận Loan | — (not found) | TTL lists only 9 Lưu stars (p.267, Phần 3 §4); not found elsewhere | **Unverified** | Vận Loan | iztro-only |

### 4.3 长生十二神 (iztro `palace.changsheng12`) — never emitted

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 临官 | iztro palace.changsheng12 — never read by algorithm.ts:510-579 | Lâm Quan | Lâm Quan | TTL p.10 §8.5 | **Verified** | Lâm Quan | iztro-only |
| 养 | iztro palace.changsheng12 — never read by algorithm.ts:510-579 | Dưỡng | Dưỡng | TTL p.10 §8.5 | **Verified** | Dưỡng | iztro-only |
| 冠带 | iztro palace.changsheng12 — never read by algorithm.ts:510-579 | Quan Đới | Quan Đới | TTL p.10 §8.5 | **Verified** | Quan Đới | iztro-only |
| 墓 | iztro palace.changsheng12 — never read by algorithm.ts:510-579 | Mộ | Mộ | TTL p.10 §8.5 | **Verified** | Mộ | iztro-only |
| 帝旺 | iztro palace.changsheng12 — never read by algorithm.ts:510-579 | Đế Vượng | Đế Vượng | TTL p.10 §8.5 | **Verified** | Đế Vượng | iztro-only |
| 死 | iztro palace.changsheng12 — never read by algorithm.ts:510-579. Note: Display collision: "Tử" also abbreviates 紫微 Tử Vi and 子女 Tử Tức. | Tử | Tử | TTL p.10 §8.5 | **Verified** | Tử | iztro-only |
| 沐浴 | iztro palace.changsheng12 — never read by algorithm.ts:510-579. Note: iztro "Mục Dục" is wrong (沐 = mộc). | Mộc Dục | Mộc Dục | TTL p.10 §8.5; HV 沐 = mộc | **Verified** | Mục Dục | iztro-only |
| 病 | iztro palace.changsheng12 — never read by algorithm.ts:510-579 | Bệnh | Bệnh | TTL p.10 §8.5 | **Verified** | Bệnh | iztro-only |
| 绝 | iztro palace.changsheng12 — never read by algorithm.ts:510-579 | Tuyệt | Tuyệt | TTL p.10 §8.5 | **Verified** | Tuyệt | iztro-only |
| 胎 | iztro palace.changsheng12 — never read by algorithm.ts:510-579 | Thai | Thai | TTL p.10 §8.5 | **Verified** | Thai | iztro-only |
| 衰 | iztro palace.changsheng12 — never read by algorithm.ts:510-579 | Suy | Suy | TTL p.272 (sample chart; the §8.5 list on p.10 drops it in the OCR) | **Verified** | Suy | iztro-only |
| 长生 | iztro palace.changsheng12 — never read by algorithm.ts:510-579. Note: Both readings in the literature; iztro: Trường Sinh. | Trường Sinh / Tràng Sinh (长 = trường, tràng) | Tràng Sinh / Trường Sinh | TTL p.10 §8.5 "Tràng Sinh"; KL p.43 "vòng Trường sinh" | **Disputed** | Trường Sinh | iztro-only |

### 4.4 Palace names

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 仆役 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638). Note: Hán-Việt Bộc Dịch is not used; Giao Hữu (交友) not found in any source checked. | Bộc Dịch | Nô Bộc | TTL p.6 §5, TOC §2.9 "NÔ BỘC" (p.168); KL p.68 | **Verified** | Nô Bộc | runtime-observed (30,144) |
| 兄弟 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638) | Huynh Đệ | Huynh Đệ | TTL p.6 §5 | **Verified** | Huynh Đệ | runtime-observed (30,144) |
| 命宫 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638). Note: isMingGong compares this exact string (algorithm.ts:575). | Mệnh Cung | Mệnh (Mệnh Viên) | TTL p.6 §5, p.7 §6 | **Verified** | Mệnh | runtime-observed (30,144) |
| 夫妻 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638). Note: TTL also names it by gender (Thê Thiếp / Phu Quân); Phu Thê is used in TTL sample charts and in KL/LQL. | Phu Thê | Phu Thê | TTL p.272 sample chart "PHU THÊ"; KL; TTL heading §2.14 uses "Thê Thiếp (Phu Quân)" by gender | **Verified** | Phu Thê | runtime-observed (30,144) |
| 子女 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638). Note: User-preferred Tử Tức is attested; iztro "Tử Nữ" not found in any source checked. | Tử Nữ | Tử Tức | TTL p.6 §5 and TOC §2.13 "TỬ TỨC" (p.198); KL; LQL | **Verified** | Tử Nữ | runtime-observed (30,144) |
| 官禄 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638) | Quan Lộc | Quan Lộc | TTL p.6 §5 | **Verified** | Quan Lộc | runtime-observed (30,144) |
| 父母 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638) | Phụ Mẫu | Phụ Mẫu | TTL TOC §2.5 "CUNG PHỤ MẪU" (p.124) | **Verified** | Phụ Mẫu | runtime-observed (30,144) |
| 田宅 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638) | Điền Trạch | Điền Trạch | TTL p.6 §5 | **Verified** | Điền Trạch | runtime-observed (30,144) |
| 疾厄 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638) | Tật Ách | Tật Ách | TTL p.6 §5 | **Verified** | Tật Ách | runtime-observed (30,144) |
| 福德 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638). Note: Collides with the Vietnamese name of 岁前 #10 (Phúc Đức) if that convention is chosen. | Phúc Đức | Phúc Đức | TTL p.6 §5 | **Verified** | Phúc Đức | runtime-observed (30,144) |
| 财帛 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638) | Tài Bạch | Tài Bạch | TTL p.6 §5 | **Verified** | Tài Bạch | runtime-observed (30,144) |
| 迁移 | Palace.name from iztro zh-CN (algorithm.ts:572); also daXians[].palaceName (algorithm.ts:638) | Thiên Di | Thiên Di | TTL p.6 §5 | **Verified** | Thiên Di | runtime-observed (30,144) |
| 交友宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo — corresponds to 仆役. Note: Collides with 仆役 (both mean the friends/servants palace). Not emitted; listed for completeness. | Giao Hữu Cung | cung Nô Bộc | TTL p.6 §5 (Nô Bộc); "Giao Hữu" not found in TTL/TVNL/KL/LQL | **Disputed** | — | declared-but-not-observed |
| 兄弟宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo. Note: Variant of 兄弟 with 宫 suffix. | Huynh Đệ Cung | cung Huynh Đệ | TTL p.6 §5 | **Verified** | — | declared-but-not-observed |
| 夫妻宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo. Note: Variant of 夫妻 with 宫 suffix. | Phu Thê Cung | cung Phu Thê | TTL p.272 sample chart "PHU THÊ"; KL; TTL heading §2.14 uses "Thê Thiếp (Phu Quân)" by gender | **Verified** | — | declared-but-not-observed |
| 子女宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo. Note: Variant of 子女 with 宫 suffix. | Tử Nữ Cung | cung Tử Tức | TTL p.6 §5 and TOC §2.13 "TỬ TỨC" (p.198); KL; LQL | **Verified** | — | declared-but-not-observed |
| 官禄宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo. Note: Variant of 官禄 with 宫 suffix. | Quan Lộc Cung | cung Quan Lộc | TTL p.6 §5 | **Verified** | — | declared-but-not-observed |
| 父母宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo. Note: Variant of 父母 with 宫 suffix. | Phụ Mẫu Cung | cung Phụ Mẫu | TTL TOC §2.5 "CUNG PHỤ MẪU" (p.124) | **Verified** | — | declared-but-not-observed |
| 田宅宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo. Note: Variant of 田宅 with 宫 suffix. | Điền Trạch Cung | cung Điền Trạch | TTL p.6 §5 | **Verified** | — | declared-but-not-observed |
| 疾厄宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo. Note: Variant of 疾厄 with 宫 suffix. | Tật Ách Cung | cung Tật Ách | TTL p.6 §5 | **Verified** | — | declared-but-not-observed |
| 福德宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo. Note: Variant of 福德 with 宫 suffix. | Phúc Đức Cung | cung Phúc Đức | TTL p.6 §5 | **Verified** | — | declared-but-not-observed |
| 财帛宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo. Note: Variant of 财帛 with 宫 suffix. | Tài Bạch Cung | cung Tài Bạch | TTL p.6 §5 | **Verified** | — | declared-but-not-observed |
| 迁移宫 | PALACE_NAMES_ORDER (constants.ts:24-27); no references anywhere else in the repo. Note: Variant of 迁移 with 宫 suffix. | Thiên Di Cung | cung Thiên Di | TTL p.6 §5 | **Verified** | — | declared-but-not-observed |
| 来因 | iztro originalPalace (来因宫); never emitted | Lai Nhân | — (not found) | not found | **Unverified** | Lai Nhân | iztro-only |
| 身宫 | iztro bodyPalace; engine exposes only the flag Palace.isShenGong (algorithm.ts:576) | Thân Cung | Thân (cung Thân, "Thân cư …") | TTL p.7 §6 "AN THÂN" | **Verified** | Thân | iztro-only |

### 4.5 Brightness grades (`Star.brightnessRaw`)

Per-school observation: see the brightness matrix in §2.5.

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 庙 | grade 1 in all four schools (school-data.ts:229-231, 238-240) | Miếu | Miếu (Miếu địa) | TTL p.32 §2.1 "Miếu địa" | **Verified** | Miếu | runtime-observed (549,392) |
| 陷 | lowest grade in all four schools. Note: iztro vi "Hạn" is wrong (陷 = hãm; Hạn is 限). | Hãm | Hãm (Hãm địa) | TTL p.33 §2.5 "Hãm địa"; HV 陷 | **Verified** | Hạn | runtime-observed (395,180) |
| 平 | grade 5 in QS/XD1, grade 3 in ZZ/XD2 | Bình | Bình hòa | TTL p.33 §2.4 "Bình hòa" | **Verified** | Bình | runtime-observed (379,472) |
| 旺 | grade 2 in all four schools | Vượng | Vượng (Vượng địa) | TTL p.32 §2.2 | **Verified** | Vượng | runtime-observed (339,468) |
| 得 | grade 3 in QS/XD1 only (school-data.ts:230) | Đắc | Đắc (Đắc địa) | TTL p.32 §2.3 | **Verified** | Đắc | runtime-observed (47,664) |
| 闲 | grade 4 in ZZ/XD2 only (school-data.ts:238-240). Note: No iztro value (iztro has no 闲). | Nhàn (闲 = nhàn, HV) | — (no matching grade) | TTL pp.32-33 §2 (no such grade); HV 闲 | **Disputed** | — | runtime-observed (32,692) |
| 不 | grade 6 in QS/XD1 only (不得地). Note: Short for 不得地 ("not in place"); iztro vi: Bất. | Bất | — (no matching grade) | TTL pp.32-33 §2 (no such grade) | **Disputed** | Bất | runtime-observed (32,108) |
| 利 | grade 4 in QS/XD1 only (school-data.ts:230). Note: No clean Vietnamese counterpart in the 5-grade Vietnamese scheme. | Lợi | — (no matching grade) | TTL pp.32-33 §2 defines only Miếu/Vượng/Đắc/Bình hòa/Hãm | **Disputed** | Lợi | runtime-observed (28,056) |
| 地 | declared in StarBrightness (types.ts:41-42) and extractRawBrightness (algorithm.ts:300); school-data.ts:227 records that 得 was once misread as 地. Note: Proven unreachable; meaning inferred from code comments only. | Địa | Đắc địa (if it means 得地) | TTL p.32 §2.3 | **Unverified** | — | proven-unreachable (see §5) |

### 4.6 四化 values (`Star.siHua`)

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 忌 | Star.siHua from iztro mutagen (algorithm.ts:525, 537, 553); birth-year 四化 only | Kỵ | Kỵ | TTL p.13-14 §8.23 "Lộc, Quyền, Khoa, Kỵ" | **Verified** | Kỵ | runtime-observed (30,144) |
| 权 | Star.siHua from iztro mutagen (algorithm.ts:525, 537, 553); birth-year 四化 only | Quyền | Quyền | TTL p.13-14 §8.23 "Lộc, Quyền, Khoa, Kỵ" | **Verified** | Quyền | runtime-observed (30,144) |
| 禄 | Star.siHua from iztro mutagen (algorithm.ts:525, 537, 553); birth-year 四化 only | Lộc | Lộc | TTL p.13-14 §8.23 "Lộc, Quyền, Khoa, Kỵ" | **Verified** | Lộc | runtime-observed (30,144) |
| 科 | Star.siHua from iztro mutagen (algorithm.ts:525, 537, 553); birth-year 四化 only | Khoa | Khoa | TTL p.13-14 §8.23 "Lộc, Quyền, Khoa, Kỵ" | **Verified** | Khoa | runtime-observed (30,144) |

### 4.7 四化 compounds (used inside pattern names and UI)

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 化忌 | compound used in pattern names/descriptions (patterns.ts) and UI; not a standalone engine value | Hóa Kỵ | Hóa Kỵ | TTL p.13 §8.23 "Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ" | **Verified** | — | declared-but-not-observed |
| 化权 | compound used in pattern names/descriptions (patterns.ts) and UI; not a standalone engine value | Hóa Quyền | Hóa Quyền | TTL p.13 §8.23 "Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ" | **Verified** | — | declared-but-not-observed |
| 化禄 | compound used in pattern names/descriptions (patterns.ts) and UI; not a standalone engine value | Hóa Lộc | Hóa Lộc | TTL p.13 §8.23 "Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ" | **Verified** | — | declared-but-not-observed |
| 化科 | compound used in pattern names/descriptions (patterns.ts) and UI; not a standalone engine value | Hóa Khoa | Hóa Khoa | TTL p.13 §8.23 "Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ" | **Verified** | — | declared-but-not-observed |

### 4.8 Heavenly stems

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 甲 | heavenly stem (constants.ts:2); Palace.stem index, year stem, 四柱 | Giáp | Giáp | TTL p.5 §2 (written "Qúy"), p.24 §11.2 | **Verified** | Giáp | runtime-observed (42,144) |
| 丙 | heavenly stem (constants.ts:2); Palace.stem index, year stem, 四柱 | Bính | Bính | TTL p.5 §2 (written "Qúy"), p.24 §11.2 | **Verified** | Bính | runtime-observed (41,280) |
| 庚 | heavenly stem (constants.ts:2); Palace.stem index, year stem, 四柱 | Canh | Canh | TTL p.5 §2 (written "Qúy"), p.24 §11.2 | **Verified** | Canh | runtime-observed (41,088) |
| 辛 | heavenly stem (constants.ts:2); Palace.stem index, year stem, 四柱 | Tân | Tân | TTL p.5 §2 (written "Qúy"), p.24 §11.2 | **Verified** | Tân | runtime-observed (40,128) |
| 丁 | heavenly stem (constants.ts:2); Palace.stem index, year stem, 四柱 | Đinh | Đinh | TTL p.5 §2 (written "Qúy"), p.24 §11.2 | **Verified** | Đinh | runtime-observed (40,032) |
| 乙 | heavenly stem (constants.ts:2); Palace.stem index, year stem, 四柱 | Ất | Ất | TTL p.5 §2 (written "Qúy"), p.24 §11.2 | **Verified** | Ất | runtime-observed (38,592) |
| 戊 | heavenly stem (constants.ts:2); Palace.stem index, year stem, 四柱 | Mậu | Mậu | TTL p.5 §2 (written "Qúy"), p.24 §11.2 | **Verified** | Mậu | runtime-observed (38,592) |
| 己 | heavenly stem (constants.ts:2); Palace.stem index, year stem, 四柱 | Kỷ | Kỷ | TTL p.5 §2 (written "Qúy"), p.24 §11.2 | **Verified** | Kỷ | runtime-observed (37,920) |
| 癸 | heavenly stem (constants.ts:2); Palace.stem index, year stem, 四柱 | Quý | Quý | TTL p.5 §2 (written "Qúy"), p.24 §11.2 | **Verified** | Quý | runtime-observed (37,632) |
| 壬 | heavenly stem (constants.ts:2); Palace.stem index, year stem, 四柱 | Nhâm | Nhâm | TTL p.5 §2 (written "Qúy"), p.24 §11.2 | **Verified** | Nhâm | runtime-observed (34,464) |

### 4.9 Earthly branches

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 子 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Tý | Tý | TTL p.5 §1 | **Verified** | Tý | runtime-observed (35,328) |
| 午 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Ngọ | Ngọ | TTL p.5 §1 | **Verified** | Ngọ | runtime-observed (34,848) |
| 亥 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Hợi | Hợi | TTL p.5 §1 | **Verified** | Hợi | runtime-observed (33,504) |
| 丑 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Sửu | Sửu | TTL p.5 §1 | **Verified** | Sửu | runtime-observed (33,312) |
| 卯 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Mão | Mão | TTL p.5 §1 | **Verified** | Mão | runtime-observed (33,024) |
| 辰 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Thìn | Thìn | TTL p.5 §1 | **Verified** | Thìn | runtime-observed (32,640) |
| 申 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Thân | Thân | TTL p.5 §1 | **Verified** | Thân | runtime-observed (32,448) |
| 酉 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Dậu | Dậu | TTL p.5 §1 | **Verified** | Dậu | runtime-observed (32,448) |
| 寅 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Dần | Dần | TTL p.5 §1 | **Verified** | Dần | runtime-observed (31,488) |
| 巳 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Tỵ | Tỵ | TTL p.5 §1 | **Verified** | Tỵ | runtime-observed (31,008) |
| 未 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Mùi | Mùi | TTL p.5 §1 | **Verified** | Mùi | runtime-observed (31,008) |
| 戌 | earthly branch (constants.ts:5); Palace.branch index, year branch, 四柱 | Tuất | Tuất | TTL p.5 §1 | **Verified** | Tuất | runtime-observed (30,816) |

### 4.10 时辰 labels (`SHICHEN`, form/UI only)

These labels never appear in chart output; they are listed because they are terminology the UI shows.

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 丑时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Sửu Thời | giờ Sửu | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 亥时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Hợi Thời | giờ Hợi | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 午时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Ngọ Thời | giờ Ngọ | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 卯时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Mão Thời | giờ Mão | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 子时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Tý Thời | giờ Tý | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 寅时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Dần Thời | giờ Dần | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 巳时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Tỵ Thời | giờ Tỵ | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 戌时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Tuất Thời | giờ Tuất | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 未时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Mùi Thời | giờ Mùi | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 申时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Thân Thời | giờ Thân | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 辰时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Thìn Thời | giờ Thìn | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |
| 酉时 | SHICHEN label (constants.ts:8-21); form/UI only, never in chart output | Dậu Thời | giờ Dậu | TTL p.6 §4 "ĐỊNH GIỜ" | **Verified** | — | declared-but-not-observed |

### 4.11 五行局 (`chart.wuxingJuName`)

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 火六局 | chart.wuxingJuName from iztro fiveElementsClass (algorithm.ts:622) | Hỏa Lục Cục | Hỏa Lục Cục | TTL p.7 §7 "LẬP CỤC" | **Verified** | Hỏa Lục Cục | runtime-observed (6,240) |
| 水二局 | chart.wuxingJuName from iztro fiveElementsClass (algorithm.ts:622) | Thủy Nhị Cục | Thủy Nhị Cục | TTL p.7 §7 "LẬP CỤC" | **Verified** | Thủy Nhị Cục | runtime-observed (6,192) |
| 木三局 | chart.wuxingJuName from iztro fiveElementsClass (algorithm.ts:622) | Mộc Tam Cục | Mộc Tam Cục | TTL p.7 §7 "LẬP CỤC" | **Verified** | Mộc Tam Cục | runtime-observed (6,176) |
| 土五局 | chart.wuxingJuName from iztro fiveElementsClass (algorithm.ts:622) | Thổ Ngũ Cục | Thổ Ngũ Cục | TTL p.7 §7 "LẬP CỤC" | **Verified** | Thổ Ngũ Cục | runtime-observed (5,936) |
| 金四局 | chart.wuxingJuName from iztro fiveElementsClass (algorithm.ts:622) | Kim Tứ Cục | Kim Tứ Cục | TTL p.7 §7 "LẬP CỤC" | **Verified** | Kim Tứ Cục | runtime-observed (5,600) |

### 4.12 阴阳 labels (`chart.yinYangGender`)

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 阳女 | chart.yinYangGender (algorithm.ts:285-287) | Dương Nữ | Dương Nữ | TTL p.6 §3 "PHÂN ÂM DƯƠNG" | **Verified** | — | runtime-observed (8,352) |
| 阳男 | chart.yinYangGender (algorithm.ts:285-287) | Dương Nam | Dương Nam | TTL p.6 §3 "PHÂN ÂM DƯƠNG" | **Verified** | — | runtime-observed (8,352) |
| 阴女 | chart.yinYangGender (algorithm.ts:285-287) | Âm Nữ | Âm Nữ | TTL p.6 §3 "PHÂN ÂM DƯƠNG" | **Verified** | — | runtime-observed (6,720) |
| 阴男 | chart.yinYangGender (algorithm.ts:285-287) | Âm Nam | Âm Nam | TTL p.6 §3 "PHÂN ÂM DƯƠNG" | **Verified** | — | runtime-observed (6,720) |

### 4.13 博士十二神 (`BOSHI_SHEN`)

十二神 are computed by `lib/ziwei/shier-shen.ts` from the natal anchors (博士: birth-year stem and gender; 岁前/将前: birth-year branch). No file in app/ or components/ imports shier-shen.ts yet, so these are engine-library identifiers, not yet on screen.

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 伏兵 | 博士十二神 #11 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131) | Phục Binh | Phục Binh | TTL p.10 §8.4 | **Verified** | Phục Binh | runtime-observed (30,144) |
| 力士 | 博士十二神 #2 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131). Note: Same i/y choice as 博士. | Lực Sĩ | Lực Sĩ / Lực Sỹ | TTL p.10 §8.4 "Lực Sỹ"; KL p.55 "Lực sĩ" | **Verified** | Lực Sỹ | runtime-observed (30,144) |
| 博士 | 博士十二神 #1 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131). Note: Orthographic variants only (i/y); pick one spelling. | Bác Sĩ | Bác Sĩ / Bác Sỹ | TTL p.16 §8.34 "Bác Sỹ"; KL p.55 "Bác sĩ" | **Verified** | Bác Sỹ | runtime-observed (30,144) |
| 喜神 | 博士十二神 #8 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131) | Hỉ Thần / Hỷ Thần | Hỷ Thần | TTL p.10 §8.4 | **Verified** | Hỷ Thần | runtime-observed (30,144) |
| 大耗 | 博士十二神 #10 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131). Note: Same string as the year-branch star 大耗. | Đại Hao | Đại Hao | TTL p.10 §8.4 | **Verified** | Đại Hao | runtime-observed (30,144) |
| 奏书 | 博士十二神 #6 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131) | Tấu Thư | Tấu Thư | TTL p.10 §8.4 | **Verified** | Tấu Thư | runtime-observed (30,144) |
| 官符 | 博士十二神 #12 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131). Note: Sources conflict; KL p.59 explicitly distinguishes "Quan phù" (Thái Tuế ring) from "Quan phủ" (Lộc Tồn ring). iztro uses 官府 here. Same string as 岁前 #5. | Quan Phù | Quan Phù / Quan Phủ | TTL p.10 §8.4 "Quan Phù"; TTL pp.273-275 sample charts and KL p.55 "Quan phủ" | **Disputed** | — | runtime-observed (30,144) |
| 将军 | 博士十二神 #5 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131) | Tướng Quân | Tướng Quân | TTL p.10 §8.4 | **Verified** | Tướng Quân | runtime-observed (30,144) |
| 小耗 | 博士十二神 #4 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131). Note: Same string as 岁前 #6. | Tiểu Hao | Tiểu Hao | TTL p.10 §8.4 | **Verified** | Tiểu Hao | runtime-observed (30,144) |
| 病符 | 博士十二神 #9 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131). Note: Same string as 岁前 #12. | Bệnh Phù | Bệnh Phù | TTL p.10 §8.4, p.272 | **Verified** | Bệnh Phù | runtime-observed (30,144) |
| 青龙 | 博士十二神 #3 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131) | Thanh Long | Thanh Long | TTL p.10 §8.4 | **Verified** | Thanh Long | runtime-observed (30,144) |
| 飞廉 | 博士十二神 #7 (shier-shen.ts:57-60), placed by boshiShenName (shier-shen.ts:127-131). Note: Collides with star 蜚廉 (iztro vi also Phi Liêm). | Phi Liêm | Phi Liêm | TTL p.10 §8.4 | **Verified** | Phi Liêm | runtime-observed (30,144) |
| 官府 | iztro boshi12 #12 (官府); engine uses 官符 instead (shier-shen.ts:59) | Quan Phủ | Quan Phủ | KL p.55; TTL pp.273-275 | **Verified** | Quan Phủ | iztro-only |

### 4.14 岁前十二神 (`SUI_QIAN_SHEN`)

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 丧门 | 岁前十二神 #3 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104) | Tang Môn | Tang Môn | TTL p.9 §8.3 | **Verified** | Tang Môn | runtime-observed (30,144) |
| 吊客 | 岁前十二神 #11 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104) | Điếu Khách | Điếu Khách | TTL p.9 §8.3 | **Verified** | Điếu Khách | runtime-observed (30,144) |
| 天德 | 岁前十二神 #10 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104). Note: Vietnamese name Phúc Đức collides with palace 福德; the star 天德 sits in the same palace (KL p.59). | Thiên Đức | Phúc Đức (position #10) | TTL p.9 §8.3; KL p.59 "Phúc đức + Thiên đức" | **Disputed** | Thiên Đức | runtime-observed (30,144) |
| 官符 | 岁前十二神 #5 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104). Note: Same string as 博士 #12. | Quan Phù | Quan Phù | TTL p.9 §8.3; KL p.59 | **Verified** | Quan Phù | runtime-observed (30,144) |
| 小耗 | 岁前十二神 #6 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104). Note: Same string as 博士 #4 (Tiểu Hao); the Vietnamese ring name differs. | Tiểu Hao | Tử Phù (position #6) | TTL p.9 §8.3 | **Disputed** | Tiểu Hao | runtime-observed (30,144) |
| 岁建 | 岁前十二神 #1 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104). Note: Hán-Việt Tuế Kiến vs Vietnamese ring name Thái Tuế (both start at the birth-year branch and run forward). iztro: "Tuế Kiện" (typo). | Tuế Kiến | Thái Tuế (ring position #1) | TTL p.9 §8.3; KL p.59 | **Disputed** | Tuế Kiện | runtime-observed (30,144) |
| 岁破 | 岁前十二神 #7 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104) | Tuế Phá | Tuế Phá | TTL p.9 §8.3 | **Verified** | Tuế Phá | runtime-observed (30,144) |
| 晦气 | 岁前十二神 #2 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104) | Hối Khí | Thiếu Dương (position #2) | TTL p.9 §8.3; KL p.59; HV 晦 | **Disputed** | Hối Khí | runtime-observed (30,144) |
| 病符 | 岁前十二神 #12 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104). Note: Same string as 博士 #9. | Bệnh Phù | Trực Phù (position #12) | TTL p.9 §8.3 | **Disputed** | Bệnh Phù | runtime-observed (30,144) |
| 白虎 | 岁前十二神 #9 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104) | Bạch Hổ | Bạch Hổ | TTL p.9 §8.3 | **Verified** | Bạch Hổ | runtime-observed (30,144) |
| 贯索 | 岁前十二神 #4 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104). Note: iztro: "Quán Tác". | Quán Sách | Thiếu Âm (position #4) | TTL p.9 §8.3; HV 贯 = quán, 索 = sách/tác | **Disputed** | Quán Tác | runtime-observed (30,144) |
| 龙德 | 岁前十二神 #8 (shier-shen.ts:48-51), placed by suiQianShenName (shier-shen.ts:102-104) | Long Đức | Long Đức | TTL p.9 §8.3 | **Verified** | Long Đức | runtime-observed (30,144) |

### 4.15 将前十二神 (`JIANG_QIAN_SHEN`)

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 亡神 | 将前十二神 #12 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99) | Vong Thần | — | not found | **Unverified** | Vong Thần | runtime-observed (30,144) |
| 劫煞 | 将前十二神 #6 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99). Note: Same string as the natal star 劫煞. | Kiếp Sát | Kiếp Sát | TTL p.15 §8.28 | **Verified** | Kiếp Sát | runtime-observed (30,144) |
| 华盖 | 将前十二神 #5 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99). Note: Same string as the natal star 华盖. | Hoa Cái | Hoa Cái | TTL p.15 §8.30 | **Verified** | Hoa Cái | runtime-observed (30,144) |
| 咸池 | 将前十二神 #10 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99). Note: Same issue as star 咸池. | Hàm Trì | Đào Hoa (by placement) | TTL pp.14-15 §8.26 | **Disputed** | Hàm Trì | runtime-observed (30,144) |
| 天煞 | 将前十二神 #8 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99) | Thiên Sát | — | not found | **Unverified** | Thiên Sát | runtime-observed (30,144) |
| 将星 | 将前十二神 #1 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99). Note: shier-shen.ts:136-143: 将星 is also a prose alias of 七杀. | Tướng Tinh | — (ring not found) | not found as a ring member (LQL vol.1 p.236 only in a verse) | **Unverified** | Tướng Tinh | runtime-observed (30,144) |
| 岁驿 | 将前十二神 #3 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99) | Tuế Dịch | — | not found | **Unverified** | Tuế Dịch | runtime-observed (30,144) |
| 息神 | 将前十二神 #4 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99) | Tức Thần | — | not found | **Unverified** | Tức Thần | runtime-observed (30,144) |
| 指背 | 将前十二神 #9 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99) | Chỉ Bối | — | not found | **Unverified** | Chỉ Bối | runtime-observed (30,144) |
| 攀鞍 | 将前十二神 #2 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99). Note: iztro: "Phan Án". | Phan An | — | not found | **Unverified** | Phan Án | runtime-observed (30,144) |
| 月煞 | 将前十二神 #11 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99) | Nguyệt Sát | — | not found | **Unverified** | Nguyệt Sát | runtime-observed (30,144) |
| 灾煞 | 将前十二神 #7 (shier-shen.ts:41-44), placed by jiangQianShenName (shier-shen.ts:97-99) | Tai Sát | — | not found | **Unverified** | Tai Sát | runtime-observed (30,144) |

### 4.16 运限 view labels

The engine emits view keys (`mingpan`, `daxian`, …) and age ranges, not these Chinese strings; the strings live in `components/TimeNav.tsx` and in iztro's common.json. So none is "runtime-observed" in engine output. The 童限 concept itself applies to every swept chart (first 大限 starts at age 2–6, `getChildhoodYears` non-empty in 30,144/30,144 charts).

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 大限 | YunxianView 'daxian'; chart.daXians (algorithm.ts:631-639); TimeNav.tsx:91 | Đại Hạn | Đại hạn | TTL p.20 §10.1 | **Verified** | Đại Hạn | declared-but-not-observed |
| 小限 | YunxianView 'xiaoxian' (yunxian-context.ts:3,9) | Tiểu Hạn | Tiểu hạn (lưu niên tiểu hạn) | TTL p.22 §10.3 (start palace 寅午戌→辰 etc., male forward, female backward = 小限 rule; cf. school-tables.generated.ts:59) | **Verified** | Tiểu Hạn | declared-but-not-observed |
| 本命 | YunxianView 'mingpan' (yunxian-context.ts:3); TimeNav tab label (TimeNav.tsx:88). Note: Hán-Việt "Bản Mệnh" already means something else in Vietnamese Tử Vi (TTL §2 "TÌM BẢN MỆNH"). Needs a different label (e.g. "Lá số gốc"). | Bản Mệnh | — (natal chart view) | TTL p.5 §2 uses "Bản Mệnh" for the nạp-âm element of the birth year | **Disputed** | — | declared-but-not-observed |
| 流年 | YunxianView 'liunian'; TimeNav.tsx:116. Note: In TTL "lưu niên" is part of the name of the 小限 method; the 流年 (year-branch palace) view corresponds to TTL's Lưu Thái Tuế. A bare "Lưu niên" label may be read as tiểu hạn. | Lưu Niên | Lưu niên | TTL p.22 §10.3 "lưu niên tiểu hạn"; p.268 §4.1 "Lưu Thái Tuế" | **Disputed** | Lưu Niên | declared-but-not-observed |
| 流日 | YunxianView 'liuri' | Lưu Nhật | Lưu nhật (hạn) | TTL p.23 §10.5 | **Verified** | Lưu Nhật | declared-but-not-observed |
| 流时 | YunxianView 'liushi'. Note: iztro: "Lưu Thì". | Lưu Thời / Lưu Thì (时 = thì, thời) | Lưu thời (hạn) | TTL p.24 §10.6 | **Verified** | Lưu Thì | declared-but-not-observed |
| 流月 | YunxianView 'liuyue'. Note: TTL offers three methods; the term matches, the method may not. | Lưu Nguyệt | Lưu nguyệt (hạn) | TTL p.23 §10.4 | **Verified** | Lưu Nguyệt | declared-but-not-observed |
| 童限 | CHILDHOOD_DAXIAN_INDEX (yunxian-context.ts:5-6), getChildhoodYears / getChildhoodDaXianPalace (yunxian-context.ts:48-94). Note: iztro vi "đứa trẻ Hạn" is a machine translation. The TVNL table (age 1 Mệnh, 2 Tài, 3 Ách, 4 Phối, 5 Phúc) matches CHILDHOOD_MING_OFFSET (yunxian-context.ts:66-72). | Đồng Hạn | Đồng hạn | TVNL vol.1 p.73 "Bảng đồng hạn của Tiểu nhi"; TVNL vol.2 pp.87-88; HV 童 = đồng | **Verified** | đứa trẻ Hạn | declared-but-not-observed |

### 4.17 格局 names (`detectPatterns`)

Counts are summed over all four brightness schools (pattern detection reads brightness, so counts differ by school; per-school counts are in the JSON).

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 杀破狼 | detectPatterns name (patterns.ts:310). Note: Vietnamese uses the star name Tham (Lang); literal Hán-Việt "Sát Phá Lang" not found. | Sát Phá Lang | Sát Phá Tham | TVNL vol.1 p.16 "bộ Sát Phá Tham"; KL; LQL | **Verified** | — | runtime-observed (7,776) |
| 府相朝垣 | detectPatterns name (patterns.ts:187) | Phủ Tướng Triều Viên | Phủ Tướng triều viên | TTL p.229 §19.2.5; KL p.83 | **Verified** | — | runtime-observed (7,296) |
| 辅弼同会 | detectPatterns name (patterns.ts:981) | Phụ Bật Đồng Hội | — | not found | **Unverified** | — | runtime-observed (6,648) |
| 昌曲同会 | detectPatterns name (patterns.ts:965) | Xương Khúc Đồng Hội | — | not found | **Unverified** | — | runtime-observed (6,432) |
| 日月同宫 | detectPatterns name (patterns.ts:432) | Nhật Nguyệt Đồng Cung | Nhật Nguyệt đồng cung | KL p.102 (8.) | **Verified** | — | runtime-observed (5,648) |
| 魁钺同会 | detectPatterns name (patterns.ts:995) | Khôi Việt Đồng Hội | — | not found | **Unverified** | — | runtime-observed (5,592) |
| 机月同梁三星会 | detectPatterns name (patterns.ts:947) | Cơ Nguyệt Đồng Lương Tam Tinh Hội | — | not found (partial form of Cơ Nguyệt Đồng Lương) | **Unverified** | — | runtime-observed (4,936) |
| 巨日同宫 | detectPatterns name (patterns.ts:488) | Cự Nhật Đồng Cung | — | "Cự Nhật" only as a star pair (TVNL, KL) | **Unverified** | — | runtime-observed (4,816) |
| 天同天梁格 | detectPatterns name (patterns.ts:407) | Thiên Đồng Thiên Lương Cách | — | "Đồng Lương" only as a star pair | **Unverified** | — | runtime-observed (4,016) |
| 武曲七杀 | detectPatterns name (patterns.ts:384) | Vũ Khúc Thất Sát | — | "Vũ Sát" only as a star pair | **Unverified** | — | runtime-observed (4,016) |
| 机月同梁 | detectPatterns name (patterns.ts:334) | Cơ Nguyệt Đồng Lương | Cơ Nguyệt Đồng Lương | TVNL vol.1 p.26; LQL vol.1 p.75 | **Verified** | — | runtime-observed (3,760) |
| 双禄朝垣 | detectPatterns name (patterns.ts:643) | Song Lộc Triều Viên | Song Lộc triều viên | LQL vol.1 p.137 | **Verified** | — | runtime-observed (3,288) |
| 火贪格 | detectPatterns name (patterns.ts:254). Note: Conventional Vietnamese name differs from the Hán-Việt reading. | Hỏa Tham Cách | Tham Hỏa tương phùng | TTL p.230 §19.2.9; KL p.86 (B.3) | **Disputed** | — | runtime-observed (3,248) |
| 武贪格 | detectPatterns name (patterns.ts:286) | Vũ Tham Cách | — | "Vũ Tham" only as a star pair (TTL p.220, KL) | **Unverified** | — | runtime-observed (3,200) |
| 廉贞天相格 | detectPatterns name (patterns.ts:359) | Liêm Trinh Thiên Tướng Cách | — | "Liêm Tướng" only as a star pair | **Unverified** | — | runtime-observed (3,104) |
| 紫府同宫 | detectPatterns name (patterns.ts:158) | Tử Phủ Đồng Cung | Tử Phủ đồng cung | TTL p.57; KL p.94 | **Verified** | — | runtime-observed (3,104) |
| 铃贪格 | detectPatterns name (patterns.ts:254). Note: Vietnamese sources fold 火贪/铃贪 into one cách. | Linh Tham Cách | Tham Hỏa/Linh tương phùng | KL p.86 (B.3: "Tham lang đồng cung với Hỏa Linh") | **Disputed** | — | runtime-observed (3,048) |
| 科权双会 | detectPatterns name (patterns.ts:1016) | Khoa Quyền Song Hội | — | "Khoa Quyền" only as a star pair | **Unverified** | — | runtime-observed (2,792) |
| 化权入官 | detectPatterns name (patterns.ts:909) | Hóa Quyền Nhập Quan | — | not found | **Unverified** | — | runtime-observed (2,576) |
| 天马入命 | detectPatterns name (patterns.ts:875) | Thiên Mã Nhập Mệnh | — | not found | **Unverified** | — | runtime-observed (2,512) |
| 天马在迁 | detectPatterns name (patterns.ts:875) | Thiên Mã Tại Thiên (Di) | — | not found | **Unverified** | — | runtime-observed (2,512) |
| 禄存守命 | detectPatterns name (patterns.ts:856) | Lộc Tồn Thủ Mệnh | — | not found as a named cách | **Unverified** | — | runtime-observed (2,512) |
| 紫微入命 | detectPatterns name (patterns.ts:559) | Tử Vi Nhập Mệnh | — | not found as a named cách | **Unverified** | — | runtime-observed (2,416) |
| 化禄入财 | detectPatterns name (patterns.ts:893) | Hóa Lộc Nhập Tài | — | not found | **Unverified** | — | runtime-observed (2,240) |
| 廉杀羊 | detectPatterns name (patterns.ts:784) | Liêm Sát Dương | — | not found | **Unverified** | — | runtime-observed (2,232) |
| 禄存守身 | detectPatterns name (patterns.ts:856) | Lộc Tồn Thủ Thân | — | not found | **Unverified** | — | runtime-observed (2,200) |
| 三奇加会 | detectPatterns name (patterns.ts:669). Note: Hán-Việt name not found; the closest Vietnamese cách has a different name and possibly different criteria. | Tam Kỳ Gia Hội | Tam Hóa liên châu | KL p.83 (A.7: Khoa Quyền Lộc spread over Mệnh/Quan/Tài) | **Disputed** | — | runtime-observed (1,904) |
| 化科入命 | detectPatterns name (patterns.ts:928) | Hóa Khoa Nhập Mệnh | — | not found | **Unverified** | — | runtime-observed (1,480) |
| 化科入身 | detectPatterns name (patterns.ts:928) | Hóa Khoa Nhập Thân | — | not found | **Unverified** | — | runtime-observed (1,408) |
| 巨火羊 | detectPatterns name (patterns.ts:799) | Cự Hỏa Dương | — | not found | **Unverified** | — | runtime-observed (1,064) |
| 辅弼夹命 | detectPatterns name (patterns.ts:584) | Phụ Bật Giáp Mệnh | — | not found (Tả Hữu giáp Mệnh not found either) | **Unverified** | — | runtime-observed (992) |
| 魁钺夹命 | detectPatterns name (patterns.ts:622) | Khôi Việt Giáp Mệnh | Khôi Việt giáp Mệnh | KL p.84 (A.9) | **Verified** | — | runtime-observed (944) |
| 空劫夹命 | detectPatterns name (patterns.ts:769) | Không Kiếp Giáp Mệnh | Không Kiếp giáp Mệnh | KL p.125 | **Verified** | — | runtime-observed (928) |
| 日月夹命 | detectPatterns name (patterns.ts:462) | Nhật Nguyệt Giáp Mệnh | Nhật Nguyệt giáp Mệnh | TTL p.230 §19.2.16; KL p.84 (10.) | **Verified** | — | runtime-observed (904) |
| 阳梁昌禄 | detectPatterns name (patterns.ts:219) | Dương Lương Xương Lộc | Dương Lương Xương Lộc | LQL vol.1 p.70 | **Verified** | — | runtime-observed (736) |
| 昌曲夹命 | detectPatterns name (patterns.ts:604) | Xương Khúc Giáp Mệnh | Xương Khúc giáp Mệnh | KL p.117 | **Verified** | — | runtime-observed (720) |
| 铃昌陀武 | detectPatterns name (patterns.ts:814) | Linh Xương Đà Vũ | — | not found | **Unverified** | — | runtime-observed (656) |
| 火铃夹命 | detectPatterns name (patterns.ts:751) | Hỏa Linh Giáp Mệnh | — | not found | **Unverified** | — | runtime-observed (624) |
| 马头带箭 | detectPatterns name (patterns.ts:835). Note: Vietnamese says kiếm (sword, 剑) where the Chinese says 箭 (arrow, tiễn). | Mã Đầu Đới Tiễn | Mã đầu đới kiếm | TTL p.231 §19.2.19, p.97, p.111 | **Disputed** | — | runtime-observed (568) |
| 昌曲坐命 | detectPatterns name (patterns.ts:965) | Xương Khúc Tọa Mệnh | — | not found | **Unverified** | — | runtime-observed (544) |
| 羊陀夹忌 | detectPatterns name (patterns.ts:731). Note: Vietnamese would call 擎羊 "Kình"; e.g. "Kình Đà giáp Kỵ" (not found). | Dương Đà Giáp Kỵ | — | not found | **Unverified** | — | runtime-observed (488) |
| 君臣庆会 | detectPatterns name (patterns.ts:130). Note: Name matches; TTL criteria (Tử Vi + Phụ Bật + Xương Khúc Khôi Việt Long Phượng) may differ from patterns.ts. | Quân Thần Khánh Hội | Quân Thần Khánh Hội | TTL p.229 §19.2.4 | **Verified** | — | runtime-observed (480) |
| 明珠出海 | detectPatterns name (patterns.ts:536) | Minh Châu Xuất Hải | Minh châu xuất hải | TTL p.230 §19.2.12; KL p.85 (A.13) | **Verified** | — | runtime-observed (360) |
| 石中隐玉 | detectPatterns name (patterns.ts:511) | Thạch Trung Ẩn Ngọc | Thạch trung ẩn ngọc | KL p.83 (A.6) | **Verified** | — | runtime-observed (328) |

### 4.18 格局 name templates

Observed expansions (e.g. 太阳化忌入命) are counted under the template; the full list of expansions is in the JSON (`observed.pattern`).

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| {主星}化禄入命 | templated detectPatterns name (patterns.ts:684); {主星} = a major star. Note: Template; star part uses the star row. | {chính tinh} Hóa Lộc Nhập Mệnh | — | not found | **Unverified** | — | runtime-observed (2,768) |
| {主星}化忌入命 | templated detectPatterns name (patterns.ts:705); {主星} = a major star. Note: Template. | {chính tinh} Hóa Kỵ Nhập Mệnh | — | not found | **Unverified** | — | runtime-observed (2,456) |
| {主星}化忌入迁 | templated detectPatterns name (patterns.ts:705); {主星} = a major star. Note: Template. | {chính tinh} Hóa Kỵ Nhập Thiên (Di) | — | not found | **Unverified** | — | runtime-observed (1,808) |

### 4.19 命宫 summary labels (`getMingGongSummary().nature`)

Emitted by `getMingGongSummary` (patterns.ts:1086-1126), displayed by `components/ChartSummary.tsx:20`.

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 空宫 | getMingGongSummary nature when 命宫 has no major star (patterns.ts:1123); Palace.isEmpty (algorithm.ts:608). Note: Hán-Việt "Không cung" is not used; the conventional term names the condition, not the palace. | Không Cung | Vô Chính Diệu (Mệnh vô Chính diệu) | TTL p.31 §1.6 "Mệnh vô Chính diệu"; KL p.12 | **Verified** | — | runtime-observed (5,368) |
| 桃花星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. "Đào Hoa" collides with the star 咸池 if that convention is chosen. | Đào Hoa Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (3,720) |
| 福德星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Phúc Đức Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (2,784) |
| 智慧星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Trí Tuệ Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (2,648) |
| 帝王星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Đế Vương Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (2,568) |
| 财帛星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Tài Bạch Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (2,328) |
| 贵人星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Quý Nhân Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (2,288) |
| 印绶星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Ấn Thụ Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (1,368) |
| 将帅星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Tướng Soái Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (1,328) |
| 荫庇星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Ấm Tí Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (1,256) |
| 变动星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Biến Động Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (1,240) |
| 财库星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Tài Khố Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (1,200) |
| 是非星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Thị Phi Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (1,192) |
| 财富星 | getMingGongSummary natureMap label for the first 命宫 major star (patterns.ts:1114-1119); shown in ChartSummary. Note: Descriptive epithet; likely better translated as plain Vietnamese than as a term. | Tài Phú Tinh | — | not checked as fixed terms (descriptive labels) | **Unverified** | — | runtime-observed (856) |

### 4.20 Structural concepts

| Chinese identifier | Meaning and usage in this code | Hán-Việt reading | Conventional Vietnamese Tử Vi term | Reference source | Status | iztro vi-VN | Reachability |
|---|---|---|---|---|---|---|---|
| 自化 | Palace.selfSihua (宫干自化, types.ts:68-69); never populated by generateChart | Tự Hóa | — (not found) | not found in TTL/TVNL/KL/LQL | **Unverified** | — | proven-unreachable (see §5) |

## 5. Special-care rows

### 5.1 Proven-unreachable identifiers: the code arguments

The script refuses to apply any of these classes if the sweep ever observes the identifier (`collect-identifiers.ts`, `PROVEN_UNREACHABLE`).

- **地 (brightness).** Every `Star.brightnessRaw` that `generateChart` writes is `extractRawBrightness(rb)` with `rb = schoolStarBrightness(…)` (algorithm.ts:367, 399, 423, 438, 440, 524, 536, 552). The two stars pushed without brightness are 劫煞 and 龙德 (algorithm.ts:564). `schoolStarBrightness` returns `BRIGHTNESS_NUM_TO_CN_BY_SCHOOL[school][v]` (school-data.ts:305). Those maps contain only 庙旺得利平不陷 (school-data.ts:229-231) or 庙旺平闲陷 (school-data.ts:238-240), never 地. The only place 地 ever entered the brightness pipeline was XD1's 巳 cell for 贪狼. That value was fed to iztro as 平 (algorithm.ts:57-58), and iztro's own `s.brightness` is never read (algorithm.ts:518-553 use the school tables instead). **Meaning, if it were reachable:** school-data.ts:227 says the old mapping "还把「得」误作「地」" (also misread 得 as 地). So 地 was a misreading of 得 (得地), which would be Vietnamese **Đắc địa**. It stays declared in `StarBrightness` (types.ts:41-42) and in the `valid` list (algorithm.ts:300).
- **截路, 空亡 (star names).** `applySchoolJiekong` renames every 截路 to 截空 and every 空亡 to 副截 in all palaces (algorithm.ts:414-417). It is called unconditionally (algorithm.ts:651). The only steps after it are `applySchoolDahao` (pushes 大耗, algorithm.ts:404) and `applySchoolFuxun` (pushes 副旬, algorithm.ts:450). Both names are still listed in `SHA_STARS` (algorithm.ts:309-311).
- **自化 (`Palace.selfSihua`).** The palace literal (algorithm.ts:569-578) has no `selfSihua`, and nothing later in `generateChart` sets it (algorithm.ts:641: "宫干自化已下线"; the `sihua.ts` import is commented out at algorithm.ts:14). The same applies to `daXians[].siHua`: the DaXian literal at algorithm.ts:634-639 has no `siHua`. The sweep agrees, with 0 occurrences of either. `detectSelfSihua`/`buildAllSelfSihua` still exist in sihua.ts:199-252 as library functions, but nothing calls them.

### 5.2 月钺 / 日钺 / 时钺 (and 运钺, 流钺)

These are iztro's flow copies of 天钺 for the hourly, daily, monthly, decadal and yearly layers (`node_modules/iztro/lib/star/horoscopeStar.js:38-87`, keys `yunyue`, `liuyue`, `yueyue`, `riyue`, `shiyue`). This engine never emits them. The only iztro horoscope call in the repo is `astrolabe.horoscope()` at algorithm.ts:591, and it reads only `age.nominalAge`. All five are **iztro-only**.

If they are ever shown, they must not collapse into natal **Thiên Việt** (天钺). There is a further problem: iztro's own vi-VN renders 月钺/日钺/时钺 as "Thiên Nguyệt(M)", "Thiên Nguyệt(d)" and "Thiên Nguyệt(H)". That is a mistranslation (钺 = *việt*; HV), and it collides with the real star 天月 (Thiên Nguyệt), which the engine *does* emit. Vietnamese literature has no names for these layers: TTL lists only nine Lưu stars (p.267-269), and those are yearly. So any label (for example "Nguyệt Việt", or "Thiên Việt (lưu nguyệt)") is a new coinage and stays **Unverified**.

### 5.3 童限

`CHILDHOOD_DAXIAN_INDEX = -2` (yunxian-context.ts:5-6) is the sentinel for the childhood period before the first 大限. `getChildhoodYears` (yunxian-context.ts:48-53) covers ages 1 to (first start age − 1). `getChildhoodDaXianPalace` (yunxian-context.ts:61-94) walks the 大命 palace for ages 1–5 by `CHILDHOOD_MING_OFFSET` = {1:0, 2:−4, 3:−5, 4:−2, 5:+2}.

The Vietnamese term is **Đồng hạn** (HV 童 = đồng). Thiên Lương, TVNL vol.1 p.73, gives a "Bảng đồng hạn của Tiểu nhi": 1 tuổi ở Mệnh, 2 Tài, 3 Ách, 4 Phối, 5 Phúc, 6 Quan… The same table appears in vol.2 pp.87-88, and Từ Điển Tử Vi has a section "TÍNH ĐỒNG HẠN". Translated into palace offsets (palaces run backwards from 命), that is exactly 0, −4 (财帛), −5 (疾厄), −2 (夫妻), +2 (福德). It confirms both the term and the semantics of the repo's offsets. iztro's "đứa trẻ Hạn" is a word-for-word machine translation and should not be used. **Verified.** In the sweep, every chart has a childhood period, because the first 大限 starts at age 2–6.

### 5.4 副旬 / 副截 (and 旬空, 截空)

The engine emits each void as **two stars**. 旬空 goes on one palace and 副旬 on its pair partner (algorithm.ts:445-451). 截空 and 副截 come from iztro's 截路 and 空亡, with the stem-parity swap (algorithm.ts:407-443). The two members of each pair share one brightness row (school-data.ts:280-283).

Vietnamese practice draws **one** Tuần and **one** Triệt *between* the two palaces. TTL p.17 says "an Tuần ở giữa cung Tuất và cung Hợi" and "an Triệt ở giữa cung Thân và cung Dậu". KL p.67 has "An Triệt giữa hai cung" and KL p.68 "An Tuần giữa hai cung". So 旬空/截空 → **Tuần/Triệt** is Verified, but 副旬 and 副截 have no Vietnamese counterpart (**Disputed**). There are three options:

1. Show both as Tuần/Triệt. This is a duplicate display, and a reader may count two voids.
2. Show the 副 star as e.g. "Tuần (phụ)" or "Triệt (phụ)". This is a coinage.
3. Render a single Tuần/Triệt mark spanning the palace pair. This changes presentation only; the engine data stays the same.

Also note that 截 is *tiệt* in Hán-Việt (HV), while the Tử Vi tradition writes **Triệt** (TTL §8.37.2). Use Triệt.

### 5.5 闲 (5-grade brightness)

闲 is grade 4 of 5 in ZZ and XD2 (school-data.ts:233-240). The comment records that it was confirmed against a 现代修订亮度表（第二版） gold chart. It is never produced by QS or XD1 (§2.5). The Hán-Việt is *nhàn* (HV). Vietnamese Tử Vi defines only Miếu, Vượng, Đắc, Bình hòa and Hãm (TTL pp.32-33, Phần 2 §2 "ĐỊNH DANH"), so there is no grade to map 闲 onto. iztro has no 闲 at all. **Disputed:** either display "Nhàn" as a literal Hán-Việt grade, or map it to the nearest Vietnamese grade. Mapping would lose the school's distinction.

### 5.6 地

See §5.1. It is proven-unreachable, and if it meant anything it was 得地, i.e. Đắc địa. It is kept as **Unverified** because the meaning is inferred from a code comment, not from a source.

### 5.7 子女

iztro zh-CN emits 子女 (algorithm.ts:572). TTL uses **Tử Tức**: in the palace order on p.6 §5, in the chapter "13. TỬ TỨC" (TOC, p.198), and in "18. PHỤ LUẬN VỀ TỬ TỨC". KL and LQL use it too. iztro's "Tử Nữ" did not occur in any of the four books. **Verified: Tử Tức**, as you asked. The unused constant `PALACE_NAMES_ORDER` writes 子女宫 (constants.ts:25). It gets the same term.

### 5.8 仆役 (Nô Bộc vs Giao Hữu)

The engine emits 仆役. TTL p.6 §5 and chapter "9. NÔ BỘC" (p.168), KL p.68 and LQL all use **Nô Bộc** (Verified). The Hán-Việt *Bộc Dịch* is not used. The dead constant `PALACE_NAMES_ORDER` has 交友宫 (constants.ts:26). Its literal Hán-Việt is "Giao Hữu", which was not found in any source, and it collides with 仆役. It is marked **Disputed**, but it is never emitted.

### 5.9 陷 (Hãm vs iztro "Hạn")

陷 is *hãm* (HV), and TTL p.33 §2.5 defines **Hãm địa**. iztro's "Hạn" is wrong: Hạn is 限 (as in Đại Hạn), so using it would collide with the 运限 vocabulary. **Verified: Hãm.**

### 5.10 不 (Bất) and 利 (Lợi)

不 (grade 6) and 利 (grade 4) exist only in the 7-grade QS and XD1 maps (school-data.ts:229-231). 不 abbreviates 不得地. Vietnamese has no matching grades (TTL pp.32-33), so both are **Disputed** pending your choice: literal "Bất" and "Lợi", or a mapping onto Vietnamese grades.

### 5.11 岁建 (Tuế Kiến vs Thái Tuế) and the 岁前 ring

The engine's 岁前十二神 (shier-shen.ts:48-51) start at the birth-year branch and run forward. That is the same rule as the Vietnamese **vòng Thái Tuế** in TTL p.9 §8.3 ("an Thái Tuế ở cung có tên hàng Chi của năm sinh … theo chiều thuận") and KL p.59. Position by position:

| # | Engine | Hán-Việt | Vietnamese ring name (TTL p.9) | Status |
|---|---|---|---|---|
| 1 | 岁建 | Tuế Kiến | Thái Tuế | Disputed |
| 2 | 晦气 | Hối Khí | Thiếu Dương | Disputed |
| 3 | 丧门 | Tang Môn | Tang Môn | Verified |
| 4 | 贯索 | Quán Sách | Thiếu Âm | Disputed |
| 5 | 官符 | Quan Phù | Quan Phù | Verified |
| 6 | 小耗 | Tiểu Hao | Tử Phù | Disputed |
| 7 | 岁破 | Tuế Phá | Tuế Phá | Verified |
| 8 | 龙德 | Long Đức | Long Đức | Verified |
| 9 | 白虎 | Bạch Hổ | Bạch Hổ | Verified |
| 10 | 天德 | Thiên Đức | Phúc Đức | Disputed |
| 11 | 吊客 | Điếu Khách | Điếu Khách | Verified |
| 12 | 病符 | Bệnh Phù | Trực Phù | Disputed |

The equivalence is positional, which is my own analysis; no source states it as a translation. Choosing the Vietnamese ring names creates collisions:

- #10 "Phúc Đức" collides with the palace 福德.
- #6 and #12 would differ from the same Chinese strings in the 博士 ring.

KL p.59 also notes that the star Thiên Đức stands with Phúc Đức, and Thiên Không with Thiếu Dương. iztro's "Tuế Kiện" for 岁建 is a typo.

### 5.12 博士 (Bác Sĩ vs Bác Sỹ) and 官符 / 官府

The 博士 ring (shier-shen.ts:57-60) matches the Vietnamese **vòng Lộc Tồn / Bác Sĩ** (TTL p.10 §8.4, p.16 §8.34; KL p.55). The spelling varies: TTL writes "Bác Sỹ, Lực Sỹ" and KL writes "Bác sĩ, Lực sĩ". That is an i/y orthography choice, not a terminology dispute, so the rows are **Verified** with a note.

Ring member 12 is a real conflict. The engine writes 官符, but iztro writes 官府. TTL §8.4 says "Quan Phù", yet TTL's sample charts (pp.273-275) and KL p.55 say "Quan phủ". KL p.59 even warns not to confuse "Quan phù" of the Thái Tuế ring with "Quan phủ" of the Lộc Tồn ring. **Disputed** for the engine's 官符 in the 博士 ring.

### 5.13 空宫 → Vô Chính Diệu

`getMingGongSummary` returns '空宫' when 命宫 has no major star (patterns.ts:1123). It appeared in 5,368 charts. `Palace.isEmpty` (algorithm.ts:608) is the structural flag. TTL p.31 §1.6 says "Nếu cung an Mệnh không có Chính diệu, gọi là Mệnh vô Chính diệu", and KL p.12 has "cung vô chính diệu". **Verified: Vô Chính Diệu.** The literal *Không Cung* is not used.

### 5.14 五行局

The five names emitted (水二局 木三局 金四局 土五局 火六局, algorithm.ts:622) appear verbatim in TTL p.7 §7 "LẬP CỤC" as Thủy nhị cục, Mộc tam cục, Kim tứ cục, Thổ ngũ cục and Hỏa lục cục. **Verified.**

### 5.15 截空 / 旬空 → Triệt / Tuần

TTL p.16 §8.37 names them "Tuần Trung không vong (Tuần)" and "Triệt Lộ không vong (Triệt)". **Verified** as Tuần and Triệt. For the second-palace stars, see §5.4.

### 5.16 化禄 / 化权 / 化科 / 化忌

The engine value is the bare 禄/权/科/忌 on `Star.siHua`. TTL p.13-14 §8.23 names the set "Tứ Hóa (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ)" and orders them "Lộc, Quyền, Khoa, Kỵ". **Verified** for both the bare and the compound forms. Only the birth-year 四化 is emitted; the 大限 and 流年 四化 overlays are computed in UI code (TimeNav.tsx:22-31).

### 5.17 Other rows that need a decision

- **咸池.** It is a natal star and also 将前 #10. Its placement table is identical to TTL's **Đào Hoa** (TTL pp.14-15 §8.26). The Hán-Việt *Hàm Trì* was not found in any source.
- **本命.** This is the natal-chart view label (TimeNav.tsx:88). Its Hán-Việt *Bản Mệnh* already means the birth-year nạp-âm element in Vietnamese Tử Vi (TTL p.5 §2 "TÌM BẢN MỆNH"), so it needs a different label.
- **天姚 and 左辅.** Each has two spellings in the literature: Thiên Riêu (TTL) vs Thiên Diêu (LQL, dictionary reading); Tả Phụ (TTL §8.7, dictionary reading) vs Tả Phù (TTL sample charts, TVNL, iztro).
- **大耗 (natal star).** The engine also places a year-branch 大耗 (algorithm.ts:381-405) besides the 博士-ring 大耗. Vietnamese literature knows only the ring star.
- **蜚廉.** This year-branch star renders as Phi Liêm, the same as 博士-ring 飞廉. In TTL, Phi Liêm exists only in the ring.

## 6. Sources

Every source below was retrieved on **2026-11-07**. Page numbers are the printed page numbers in each scan's OCR text. Section numbers are the book's own numbering.

- **TTL.** Vân Đằng Thái Thứ Lang, *Tử Vi Đẩu Số Tân Biên*. It has three parts: Phần 1 Lập thành, Phần 2 Luận đoán 12 cung, Phần 3 Luận đoán vận hạn. The scanned cover carries the publication permit "Giấy phép số … ngày 13-5-57". I used the re-typeset edition digitized at https://archive.org/details/TuViDdauSoTanBien-VDThaiThuLang-DV, reading the OCR files `Tử-Vi-Đầu-Số-Tan-Bien-Van-Đằng-Thai-Thứ-Lang-dv01…dv06_djvu.txt` and the table of contents `MUCLUC…_djvu.txt`. The pages cited are 5–24 (An sao, Khởi hạn), 31–33 (Định danh, i.e. brightness grades), 57, 77, 97, 111, 124, 168, 198, 220, 229–231 (§19 Phân cục), 267–275 (Lưu stars and sample charts).
- **TVNL.** Thiên Lương, *Tử Vi Nghiệm Lý Toàn Thư*. Archive.org item https://archive.org/details/TViNghihmLToanThu-dv, files `TửViNghiệmLý-ToanThu-01/02/03_djvu.txt`. Cited: vol.1 p.16, p.26, p.73 ("Bảng đồng hạn của Tiểu nhi"); vol.2 pp.87-88.
- **KL.** TS Hoàng Thường and TS Hàm Chương, *Tử Vi Khảo Luận*. https://archive.org/details/tuvikhaoluan, file `Tử vi khảo luận - TS Hoàng Thường, TS Hàm Chương_djvu.txt`. Cited: p.12, p.43, p.55 (vòng Lộc tồn / Bác sĩ), p.59 (vòng Thái tuế), pp.67-68 (Triệt and Tuần "giữa hai cung"), pp.82-86 (list of cách), p.94, p.102, p.117, p.125.
- **LQL.** Lê Quang Lăng, *Tử Vi Nam Phái*, parts 1–2. https://archive.org/details/tu-vi-nam-phai-le-quang-lang, files `Tử vi Nam phái Lê Quang Lăng 1_djvu.txt` and `… 2_djvu.txt`. Cited: vol.1 p.18 (Thiên Diêu), p.70, p.75, p.137, p.236.
- **TĐ.** *Từ Điển Tử Vi* (Phúc Thắng, Hà Nội; running header "Dac Loc"). https://archive.org/details/tudientuviphucthac. Its OCR has lost all diacritics, so I used it only as corroboration: the section "TINH DONG HAN" (Đồng hạn) and "THANG NHUAN" (a leap-month 15/16 split, which matches policy `split`). No status rests on TĐ alone.
- **HV.** Hán-Việt readings from the Thi Viện Hán-Việt dictionary, `https://hvdic.thivien.net/whv/<character>`. Readings I relied on: 截 tiệt; 钺 việt; 蜚 phi, phỉ; 姚 dao, diêu; 闲 nhàn; 贯 quán; 索 sách, tác; 副 phó; 童 đồng; 旬 tuần; 晦 hối; 建 kiến; 沐 mộc; 辅 phụ; 陷 hãm; 时 thì, thời; 咸 hàm. The site rate-limited me after about 100 characters, so the Hán-Việt readings of the remaining common characters (天, 星, 紫, …) were not individually checked against the dictionary.
- **iztro.** `node_modules/iztro` version 2.6.1, `lib/i18n/locales/{zh-CN,vi-VN}/*.js` and `common.json`, plus `lib/star/horoscopeStar.js`. Used for the comparison column only.

Sources I could not use:

- Nguyễn Phát Lộc, *Tử Vi Hàm Số* (1974). The archive.org item `bwb_Y0-CHB-767` is access-restricted (HTTP 401 on its text).
- Vũ Tài Lục. No digitized text located.
- A Vietnamese translation of 《紫微斗数全书》. Archive.org item `20260506_20260506_1217` turned out to be the Chinese Ming edition, not a translation.
- Web search. The search tool is US-centred and returned almost no usable Vietnamese Tử Vi pages, so I fetched books from archive.org directly instead.

## 7. Summary

| Status | Rows |
|---|---|
| Verified | 196 |
| Disputed | 26 |
| Unverified | 106 |
| **Total** | **328** |

Status by reachability:

| Reachability \ Status | Verified | Disputed | Unverified |
|---|---|---|---|
| runtime-observed | 145 | 22 | 55 |
| declared-but-not-observed | 32 | 3 | 0 |
| proven-unreachable | 1 | 0 | 3 |
| iztro-only | 18 | 1 | 48 |

Status by category:

| Category | Verified | Disputed | Unverified |
|---|---|---|---|
| star | 61 | 7 | 6 |
| flowStar | 4 | 0 | 46 |
| changsheng12 | 11 | 1 | 0 |
| palace | 23 | 1 | 1 |
| brightness | 5 | 3 | 1 |
| sihua | 4 | 0 | 0 |
| sihuaCompound | 4 | 0 | 0 |
| stem | 10 | 0 | 0 |
| branch | 12 | 0 | 0 |
| shichen | 12 | 0 | 0 |
| wuxingJu | 5 | 0 | 0 |
| yinYangGender | 4 | 0 | 0 |
| shierShen.boshi | 12 | 1 | 0 |
| shierShen.suiqian | 6 | 6 | 0 |
| shierShen.jiangqian | 2 | 1 | 9 |
| yunxianLabel | 6 | 2 | 0 |
| pattern | 14 | 4 | 26 |
| patternTemplate | 0 | 0 | 3 |
| mingGongSummary.nature | 1 | 0 | 13 |
| concept | 0 | 0 | 1 |

#### Disputed items that need your decision

- **副截** (star): Phó Tiệt (副 = phó) vs none (Triệt covers both palaces). Repo-specific name. Collides with 截空 if both are shown as "Triệt".
- **副旬** (star): Phó Tuần vs none (Tuần covers both palaces). Repo-specific name. Collides with 旬空 if both are shown as "Tuần".
- **咸池** (star): Hàm Trì vs Đào Hoa (by placement). The Vietnamese tradition names this star Đào Hoa; the Hán-Việt reading is Hàm Trì. Decide whether to display the conventional name.
- **大耗** (star): Đại Hao vs Đại Hao. Display collision: the engine emits both this year-branch 大耗 star and the 博士 ring 大耗; Vietnamese literature has only the ring star. Needs a disambiguating label.
- **天姚** (star): Thiên Diêu (姚 = dao, diêu; HV) vs Thiên Riêu / Thiên Diêu. "Riêu" is the traditional Tử Vi reading (not a dictionary reading of 姚); "Diêu" is the dictionary Hán-Việt. iztro: Thiên Diêu.
- **左辅** (star): Tả Phụ (辅 = phụ, HV) vs Tả Phụ / Tả Phù. Two spellings in the literature (same book uses both). iztro: Tả Phù. Needs an orthography decision.
- **蜚廉** (star): Phi Liêm / Phỉ Liêm (蜚 = phi, phỉ; HV) vs — (Vietnamese Phi Liêm is the 博士 ring star 飞廉). Display collision with 博士 ring 飞廉 (Phi Liêm). iztro: Phi Liêm.
- **长生** (changsheng12): Trường Sinh / Tràng Sinh (长 = trường, tràng) vs Tràng Sinh / Trường Sinh. Both readings in the literature; iztro: Trường Sinh.
- **交友宫** (palace): Giao Hữu Cung vs cung Nô Bộc. Collides with 仆役 (both mean the friends/servants palace). Not emitted; listed for completeness.
- **闲** (brightness): Nhàn (闲 = nhàn, HV) vs — (no matching grade). No iztro value (iztro has no 闲).
- **不** (brightness): Bất vs — (no matching grade). Short for 不得地 ("not in place"); iztro vi: Bất.
- **利** (brightness): Lợi vs — (no matching grade). No clean Vietnamese counterpart in the 5-grade Vietnamese scheme.
- **官符** (shierShen.boshi): Quan Phù vs Quan Phù / Quan Phủ. Sources conflict; KL p.59 explicitly distinguishes "Quan phù" (Thái Tuế ring) from "Quan phủ" (Lộc Tồn ring). iztro uses 官府 here. Same string as 岁前 #5.
- **天德** (shierShen.suiqian): Thiên Đức vs Phúc Đức (position #10). Vietnamese name Phúc Đức collides with palace 福德; the star 天德 sits in the same palace (KL p.59).
- **小耗** (shierShen.suiqian): Tiểu Hao vs Tử Phù (position #6). Same string as 博士 #4 (Tiểu Hao); the Vietnamese ring name differs.
- **岁建** (shierShen.suiqian): Tuế Kiến vs Thái Tuế (ring position #1). Hán-Việt Tuế Kiến vs Vietnamese ring name Thái Tuế (both start at the birth-year branch and run forward). iztro: "Tuế Kiện" (typo).
- **晦气** (shierShen.suiqian): Hối Khí vs Thiếu Dương (position #2).
- **病符** (shierShen.suiqian): Bệnh Phù vs Trực Phù (position #12). Same string as 博士 #9.
- **贯索** (shierShen.suiqian): Quán Sách vs Thiếu Âm (position #4). iztro: "Quán Tác".
- **咸池** (shierShen.jiangqian): Hàm Trì vs Đào Hoa (by placement). Same issue as star 咸池.
- **本命** (yunxianLabel): Bản Mệnh vs — (natal chart view). Hán-Việt "Bản Mệnh" already means something else in Vietnamese Tử Vi (TTL §2 "TÌM BẢN MỆNH"). Needs a different label (e.g. "Lá số gốc").
- **流年** (yunxianLabel): Lưu Niên vs Lưu niên. In TTL "lưu niên" is part of the name of the 小限 method; the 流年 (year-branch palace) view corresponds to TTL's Lưu Thái Tuế. A bare "Lưu niên" label may be read as tiểu hạn.
- **火贪格** (pattern): Hỏa Tham Cách vs Tham Hỏa tương phùng. Conventional Vietnamese name differs from the Hán-Việt reading.
- **铃贪格** (pattern): Linh Tham Cách vs Tham Hỏa/Linh tương phùng. Vietnamese sources fold 火贪/铃贪 into one cách.
- **三奇加会** (pattern): Tam Kỳ Gia Hội vs Tam Hóa liên châu. Hán-Việt name not found; the closest Vietnamese cách has a different name and possibly different criteria.
- **马头带箭** (pattern): Mã Đầu Đới Tiễn vs Mã đầu đới kiếm. Vietnamese says kiếm (sword, 剑) where the Chinese says 箭 (arrow, tiễn).


#### Display-term collisions (one Chinese identifier per row, but the Vietnamese would coincide)

- 截空 / 副截 / 截路 all → Triệt. 旬空 / 副旬 / 旬中 all → Tuần (§5.4).
- 大耗 (year-branch star) vs 博士 #10 大耗 → Đại Hao.
- 蜚廉 (star) vs 博士 #7 飞廉 → Phi Liêm.
- 劫煞 (star), 将前 #6 劫煞 and iztro 劫杀 → Kiếp Sát.
- 华盖 (star) vs 将前 #5. 咸池 (star) vs 将前 #10. 龙德 (star) vs 岁前 #8. These are the same concept emitted twice.
- 小耗, 官符 and 病符 each occur in both 博士 and 岁前. If the Vietnamese ring names are adopted, the 岁前 copies become Tử Phù, Quan Phù and Trực Phù, while the 博士 copies stay Tiểu Hao, Quan Phù/Quan Phủ and Bệnh Phù.
- 岁前 #10 天德 → Phúc Đức (if the Vietnamese ring name is chosen) collides with palace 福德 (Phúc Đức) and with star 天德 (Thiên Đức).
- 仆役 vs 交友宫 → Nô Bộc. Also 子女 vs 子女宫, and the other 宫-suffixed variants (intended).
- Flow 月钺/日钺/时钺 → iztro "Thiên Nguyệt(…)" collides with 天月 (Thiên Nguyệt). Natal 天钺 must stay separate from all flow 钺 stars.
- 本命 → Bản Mệnh collides with the Vietnamese "Bản Mệnh" (nạp-âm element).
- 死 (长生 ring, iztro-only) → Tử, which is ambiguous with Tử (紫微) and Tử Tức.
- 桃花星 (summary label) vs 咸池 → Đào Hoa, if that convention is chosen.

#### Known gaps

- **Verified means the term is attested, not that the rules match.** Several Verified names have different placement or criteria in the Vietnamese book: 解神/Giải Thần placement, 君臣庆会 criteria, and the three 流月 methods. I did not compare pattern criteria in detail.
- **OCR quality.** The archive.org OCR drops words occasionally: Phụ Mẫu is missing from the p.6 palace list and Suy from the p.10 ring list. In each case I confirmed the term on another page (TOC p.124, sample chart p.272).
- **Labels that are not engine values are out of scope here and belong to D2:** 命主, 身主, 五行局, 大限, the 流年 headings in the UI, and the brightness legend. 命主 and 身主 as labels were not found in TTL. Hits for "Mệnh chủ" in KL and LQL are prose ("ở Mệnh chủ…"), not the 命主 concept, so no source attests them.
- **Mostly unattested groups.** The 将前十二神 ring, most 格局 names, the 运/月/日/时 flow layers and the 命宫 summary epithets have no Vietnamese literature counterpart in the four books searched. Their rows are honestly Unverified.
- **The sweep is finite.** The date grid is 1960–2010, plus leap months up to 2033 and 16 boundary dates. Reachability claims beyond "observed" rest on the code arguments in §5.1, not on the sweep. For star names, every observed name appeared in every chart, so the star list is very unlikely to be incomplete. Brightness and patterns are school-dependent and are reported per school in the JSON.
- **Not on screen yet.** `lib/ziwei/shier-shen.ts` and `lib/ziwei/yunxian-context.ts` are not imported by anything in app/ or components/ yet. yunxian-context.ts is imported only by `lib/ziwei/sihua.ts`, which the UI does not import either. Their identifiers are engine-library identifiers.
- **Possible new finding.** `generateChart` throws for a day-30 birth in a 30-day leap month under `origin-month` (§2.6).
