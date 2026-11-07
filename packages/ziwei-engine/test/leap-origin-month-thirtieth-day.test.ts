/**
 * Regression: the `origin-month` leap policy must chart day 30 of a 30-day leap month.
 *
 * Bug (docs/decisions/localization.md D-8): `generateChart` threw
 * "only 29 days in lunar year 2017 month 6" for 2017-08-21 (农历 2017 闰六月三十) under
 * `origin-month`, for every hour and gender. The engine called
 * `astro.byLunar('2017-6-30', …, isLeapMonth=true, fixLeap=false)`; iztro's lunar→solar step
 * (lunar-lite 0.2.8 `lunar2solar`) first builds the date in the *regular* sixth month, which has
 * only 29 days, and throws before it switches to the 30-day leap month.
 * Solution doc: docs/solutions/engine/origin-month-must-not-round-trip-a-leap-day-through-iztro-bylunar.md
 *
 * Sources of the expected values (none come from the engine under test):
 * - The 17 dates are every day in 1900–2100 that is day 30 of a 30-day leap month whose regular
 *   month has 29 days; each is re-checked below against lunar-javascript's month lengths, so the
 *   list can't silently stop testing the case.
 * - The lunar date the chart reports (闰N月三十) comes from lunar-javascript.
 * - The policy definition in lib/ziwei/school-config.ts: `origin-month` = "不调整（闰月仍标闰月，
 *   iztro fixLeap=false）", i.e. iztro's `bySolar(<birth date>, …, fixLeap=false)`. The chart's
 *   命宫 and the 14 major stars are compared palace by palace with iztro called directly.
 */
import assert from 'node:assert/strict';
import { astro } from 'iztro';
import { LunarMonth, Solar } from 'lunar-javascript';
import { generateChart } from '../src/algorithm';
import type { Palace, Star, ZiweiChart } from '../src/types';

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// [solar date, lunar year, leap month] for every 1900–2100 day-30-of-a-30-day-leap-month birth
// whose regular month has 29 days.
const DATES: Array<[number, number, number, number, number]> = [
  [1906, 6, 21, 1906, 4], [1914, 7, 22, 1914, 5], [1919, 9, 23, 1919, 7], [1925, 6, 20, 1925, 4],
  [1936, 5, 20, 1936, 3], [1938, 9, 23, 1938, 7], [1941, 8, 22, 1941, 6], [1944, 6, 20, 1944, 4],
  [1952, 7, 21, 1952, 5], [1955, 5, 21, 1955, 3], [2017, 8, 21, 2017, 6], [2036, 8, 21, 2036, 6],
  [2047, 7, 22, 2047, 5], [2050, 5, 20, 2050, 3], [2055, 8, 22, 2055, 6], [2058, 6, 20, 2058, 4],
  [2093, 8, 21, 2093, 6],
];

// ① Each date really is the case under test (lunar-javascript, independent of iztro).
for (const [y, m, d, ly, lm] of DATES) {
  const lunar = Solar.fromYmd(y, m, d).getLunar();
  assert.equal(Number(lunar.getYear()), ly, `${y}-${m}-${d}: lunar year`);
  assert.equal(Number(lunar.getMonth()), -lm, `${y}-${m}-${d}: should be 闰${lm}月`);
  assert.equal(Number(lunar.getDay()), 30, `${y}-${m}-${d}: should be the 30th`);
  assert.equal(LunarMonth.fromYm(ly, -lm)?.getDayCount(), 30, `${ly} 闰${lm}月 should have 30 days`);
  assert.equal(LunarMonth.fromYm(ly, lm)?.getDayCount(), 29, `${ly} regular ${lm}月 should have 29 days`);
}

let charts = 0;
for (const [y, m, d, ly, lm] of DATES) {
  for (let hour = 0; hour < 12; hour++) {
    for (const gender of ['male', 'female'] as const) {
      // ② origin-month charts the date instead of throwing.
      let chart: ZiweiChart;
      try {
        chart = generateChart({ year: y, month: m, day: d, hour, gender }, { leapMonth: 'origin-month' });
      } catch (e) {
        assert.fail(`${y}-${m}-${d} hour ${hour} ${gender}: origin-month threw "${e instanceof Error ? e.message : e}"`);
      }
      charts++;

      // ③ The chart keeps the leap month: lunar date ${ly} 闰${lm}月三十.
      assert.equal(chart.lunarInfo.lunarYear, ly, `${y}-${m}-${d}: lunarInfo.lunarYear`);
      assert.equal(chart.lunarInfo.lunarDay, 30, `${y}-${m}-${d}: lunarInfo.lunarDay`);
      assert.equal(chart.lunarInfo.isLeapMonth, true, `${y}-${m}-${d}: origin-month keeps the leap flag`);
      assert.equal(Math.abs(chart.lunarInfo.lunarMonth), lm, `${y}-${m}-${d}: lunarInfo.lunarMonth`);

      // ④ Same palaces and major stars as the policy definition: iztro bySolar with fixLeap=false.
      const ref = astro.bySolar(`${y}-${m}-${d}`, hour, gender === 'male' ? '男' : '女', false, 'zh-CN');
      for (const p of ref.palaces) {
        const branch = BRANCHES.indexOf(p.earthlyBranch as string);
        const ours: Palace | undefined = chart.palaces.find((x: Palace) => x.branch === branch);
        assert.ok(ours, `${y}-${m}-${d} hour ${hour}: no palace at ${p.earthlyBranch}`);
        assert.equal(ours.name, p.name, `${y}-${m}-${d} hour ${hour} ${gender}: palace name at ${p.earthlyBranch}`);
        const want = p.majorStars.map((s) => s.name).sort().join(',');
        const got = ours.stars.filter((s: Star) => s.type === 'major').map((s: Star) => s.name).sort().join(',');
        assert.equal(got, want, `${y}-${m}-${d} hour ${hour} ${gender}: major stars in ${p.name}`);
      }
    }
  }
}

console.log(`leap-origin-month-thirtieth-day regression passed (${DATES.length} dates, ${charts} charts)`);
