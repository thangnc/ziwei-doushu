/**
 * Phase 0 / D1 — terminology identifier collector (READ-ONLY).
 *
 * Lists every Chinese identifier the charting engine (packages/ziwei-engine/src/, formerly lib/ziwei/) can emit, together with
 * the identifiers that are only DECLARED in engine types/tables and the ones that exist only
 * in iztro's locale data, and assigns each one exactly one reachability class:
 *
 *   runtime-observed           seen in this script's sweep output
 *   declared-but-not-observed  present in an engine type/table/source, not seen in the sweep
 *   proven-unreachable         only with a cited code argument (PROVEN_UNREACHABLE below);
 *                              a finite sweep never proves unreachability
 *   iztro-only                 exists in iztro locale/data, never emitted by this engine
 *
 * Usage (from the repo root):
 *   npx tsx scripts/i18n/collect-identifiers.ts [--out path.json] [--workers N]
 *
 * Output is deterministic JSON (no timestamps); --workers only changes speed, not output.
 * The script writes nothing except the optional --out file and does not modify engine state
 * beyond the global brightness school, which it resets to 'default' before exiting.
 */
import * as nodeModule from 'node:module';
import { fork } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// patterns.ts imports 'server-only', which isn't installed outside a Next build.
// Same stub as scripts/regression/patterns-sihua-bonus.test.ts (Node 22.15+ / 23.5+).
type HookResult = { url?: string; format?: string; source?: string; shortCircuit?: boolean };
const { registerHooks } = nodeModule as unknown as {
  registerHooks(hooks: {
    resolve(specifier: string, context: unknown, next: (s: string, c: unknown) => HookResult): HookResult;
    load(url: string, context: unknown, next: (u: string, c: unknown) => HookResult): HookResult;
  }): void;
};
const SERVER_ONLY_STUB = 'data:text/javascript,';
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') return { url: SERVER_ONLY_STUB, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === SERVER_ONLY_STUB) return { format: 'commonjs', source: '', shortCircuit: true };
    return nextLoad(url, context);
  },
});

import { Solar, LunarMonth } from 'lunar-javascript';
import {
  generateChart, setBrightnessSchool, resolveEffectiveLunarDate,
  calcMingZhu, calcShenZhu, calcYinYangGender,
  type LunarMonthPolicy,
} from '../../packages/ziwei-engine/src/algorithm';
import { STEMS, BRANCHES, PALACE_NAMES_ORDER, JU_NAMES, SI_HUA_TABLE, STAR_DESCRIPTIONS, SHICHEN } from '../../packages/ziwei-engine/src/constants';
import {
  SCHOOL_STAR_ID_TO_NAME, BRIGHTNESS_NUM_TO_CN, BRIGHTNESS_NUM_TO_CN_5, BRIGHTNESS_NUM_TO_CN_BY_SCHOOL,
  SCHOOL_MING_ZHU_BY_DIZHI, SCHOOL_SHEN_ZHU_BY_DIZHI, type BrightnessSchool,
} from '../../packages/ziwei-engine/src/school-data';
import { SCHOOL_AX } from '../../packages/ziwei-engine/src/school-tables.generated';
import {
  JIANG_QIAN_SHEN, SUI_QIAN_SHEN, BOSHI_SHEN,
  jiangQianShenName, suiQianShenName, boshiShenName,
} from '../../packages/ziwei-engine/src/shier-shen';
import { getChildhoodYears } from '../../packages/ziwei-engine/src/yunxian-context';
import { formToBirthInfo } from '../../packages/ziwei-engine/src/share';
import type { ZiweiChart } from '../../packages/ziwei-engine/src/types';

const REPO = path.resolve(__dirname, '../..');
const rel = (p: string) => path.relative(REPO, p).split(path.sep).join('/');
const readSrc = (p: string) => fs.readFileSync(path.join(REPO, p), 'utf8');

// ─────────────────────────────── sweep definition ───────────────────────────────
const SCHOOLS: BrightnessSchool[] = ['QS', 'XD1', 'ZZ', 'XD2'];
const POLICIES: LunarMonthPolicy[] = ['split', 'next-month', 'prev-month', 'origin-month'];
const GENDERS = ['male', 'female'] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => i);

type Ymd = [number, number, number];
type SetName = 'base-grid' | 'leap-month' | 'boundary';
interface Job { set: SetName; y: number; m: number; d: number; hour: number; gender: 'male' | 'female'; school: BrightnessSchool; policy: LunarMonthPolicy }

/** Same grid as .claude/skills/chart/chart.ts --sweep (dates only; hours are extended to all 12). */
function baseGridDates(): Ymd[] {
  const extra: Ymd[] = [
    [1984, 2, 4], [1999, 2, 11], [2001, 5, 23], [2004, 3, 21], [2006, 8, 24], [2020, 5, 23], [2023, 3, 22], [2023, 4, 19],
  ];
  const dates: Ymd[] = [];
  for (let y = 1960; y <= 2010; y += 7) for (let m = 1; m <= 12; m += 3) for (let d = 5; d <= 26; d += 10) dates.push([y, m, d]);
  dates.push(...extra);
  return dates;
}

function isRawLeap([y, m, d]: Ymd): boolean {
  return Number(Solar.fromYmd(y, m, d).getLunar().getMonth()) < 0;
}

function lunarLabel([y, m, d]: Ymd): string {
  const l = Solar.fromYmd(y, m, d).getLunar();
  const mo = Number(l.getMonth());
  return `${l.getYear()}-${mo < 0 ? '闰' : ''}${Math.abs(mo)}-${l.getDay()} (${l.getYearGan()}${l.getYearZhi()}年)`;
}

/** Scan for every leap lunar month STARTING 1960-01-01..2033-12-31 (scan runs to 2034-03-31 so a month straddling the year end is complete). */
function scanLeapMonths(): Map<string, { lunarYear: number; month: number; days: Map<number, Ymd> }> {
  const out = new Map<string, { lunarYear: number; month: number; days: Map<number, Ymd> }>();
  const t = new Date(Date.UTC(1960, 0, 1));
  const end = Date.UTC(2034, 2, 31);
  const lastStart = Date.UTC(2033, 11, 31);
  while (t.getTime() <= end) {
    const ymd: Ymd = [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
    const l = Solar.fromYmd(...ymd).getLunar();
    const mo = Number(l.getMonth());
    if (mo < 0) {
      const key = `${l.getYear()}-闰${-mo}`;
      if (!out.has(key) && t.getTime() <= lastStart) out.set(key, { lunarYear: Number(l.getYear()), month: -mo, days: new Map() });
      out.get(key)?.days.set(Number(l.getDay()), ymd);
    }
    t.setUTCDate(t.getUTCDate() + 1);
  }
  return out;
}

/** Requested leap months first (闰四月 2020, 闰二月 2023, 闰六月 2017), then the first leap month of every other month number. */
function selectLeapMonths() {
  const all = scanLeapMonths();
  const wanted = ['2020-闰4', '2023-闰2', '2017-闰6'];
  const chosen: string[] = [];
  for (const k of wanted) if (all.has(k)) chosen.push(k);
  const covered = new Set(chosen.map((k) => all.get(k)!.month));
  for (const [k, v] of all) if (!covered.has(v.month)) { covered.add(v.month); chosen.push(k); }
  const dates: { key: string; lunarDay: number; ymd: Ymd }[] = [];
  for (const k of chosen) {
    const v = all.get(k)!;
    const last = Math.max(...v.days.keys());
    for (const ld of [1, 15, 16, last]) dates.push({ key: k, lunarDay: ld, ymd: v.days.get(ld)! });
  }
  return { allLeapMonthsFound: [...all.keys()], chosen, dates };
}

/** Boundary / special cases. Late-子时 cases go through formToBirthInfo (the real form path). */
function boundaryCases() {
  const fixed: { ymd: Ymd; why: string }[] = [
    { ymd: [1999, 2, 4], why: '立春 day (1999-02-04), before 正月初一' },
    { ymd: [1999, 2, 11], why: 'after 立春, before 正月初一 (1999-02-16): still 戊寅 lunar year' },
    { ymd: [1999, 2, 16], why: '正月初一 1999 (己卯 lunar year starts)' },
    { ymd: [2004, 2, 4], why: '立春 day 2004 (立春 at 19:56; regression in sizhu-lichun-boundary)' },
    { ymd: [1984, 2, 2], why: '正月初一 1984 (甲子)' },
    { ymd: [1990, 1, 31], why: 'month end (31)' },
    { ymd: [1990, 2, 28], why: 'month end, non-leap February' },
    { ymd: [1996, 2, 29], why: 'month end, leap-year February 29' },
    { ymd: [2000, 2, 29], why: 'month end, century leap-year February 29' },
    { ymd: [1990, 4, 30], why: 'month end (30)' },
    { ymd: [1989, 12, 31], why: 'year end' },
    { ymd: [1990, 1, 1], why: 'year start' },
    { ymd: [1999, 12, 31], why: 'year end (millennium)' },
    { ymd: [2000, 1, 1], why: 'year start (millennium)' },
    { ymd: [2010, 12, 31], why: 'year end (end of grid range)' },
    { ymd: [1960, 1, 1], why: 'year start (start of grid range)' },
  ];
  const lateZi = [
    { y: 1990, m: 5, d: 9 }, { y: 1999, m: 12, d: 31 }, { y: 2000, m: 2, d: 28 }, { y: 1990, m: 1, d: 31 },
  ].map(({ y, m, d }) => {
    const info = formToBirthInfo({
      name: '', year: String(y), month: String(m), day: String(d), clockHour: '23', clockMinute: '30',
      unknownTime: false, province: 'audit', city: '', longitude: 120, gender: 'male',
    } as Parameters<typeof formToBirthInfo>[0]);
    return {
      input: `${y}-${m}-${d} 23:30 @120°E (form path, late 子时)`,
      ymd: [info.year, info.month, info.day] as Ymd,
      hourFromForm: info.hour,
      why: `late 子时 day change: charting day ${info.year}-${info.month}-${info.day}, branch ${BRANCHES[info.hour]}`,
    };
  });
  return { fixed, lateZi };
}

function buildJobs() {
  const jobs: Job[] = [];
  const base = baseGridDates();
  const leap = selectLeapMonths();
  const boundary = boundaryCases();
  const push = (set: SetName, ymd: Ymd) => {
    // Leap policy can only change output when the raw lunar month is a leap month
    // (algorithm.ts:158-167 returns early for non-leap; algorithm.ts:486 only branches on rawLunarMonth < 0),
    // so non-leap dates are charted under the default policy only.
    const policies = isRawLeap(ymd) ? POLICIES : (['split'] as LunarMonthPolicy[]);
    for (const school of SCHOOLS) for (const policy of policies) for (const hour of HOURS) for (const gender of GENDERS)
      jobs.push({ set, y: ymd[0], m: ymd[1], d: ymd[2], hour, gender, school, policy });
  };
  for (const ymd of base) push('base-grid', ymd);
  for (const { ymd } of leap.dates) push('leap-month', ymd);
  const seen = new Set<string>();
  for (const { ymd } of [...boundary.fixed, ...boundary.lateZi]) {
    const k = ymd.join('-');
    if (seen.has(k)) continue;
    seen.add(k);
    push('boundary', ymd);
  }
  return { jobs, base, leap, boundary };
}

// ─────────────────────────────── worker: run charts ───────────────────────────────
type Counter = Record<string, number>;
interface Agg {
  charts: number;
  errors: Counter;
  perConfig: Counter;              // `${set}|${school}|${policy}` → charts
  cat: Record<string, Counter>;    // category → value → count
  brightnessBySchool: Record<string, Counter>;
  patternsBySchool: Record<string, Counter>;
  childhoodApplicable: number;
  firstDaXianStartAge: Counter;
  selfSihuaPopulated: number;
  daXianSiHuaPopulated: number;
  ganzhiPairs: Counter;
}

function newAgg(): Agg {
  return {
    charts: 0, errors: {}, perConfig: {}, cat: {}, brightnessBySchool: {}, patternsBySchool: {},
    childhoodApplicable: 0, firstDaXianStartAge: {}, selfSihuaPopulated: 0, daXianSiHuaPopulated: 0, ganzhiPairs: {},
  };
}
const inc = (c: Counter, k: string, n = 1) => { c[k] = (c[k] ?? 0) + n; };
const incCat = (a: Agg, cat: string, k: string) => inc((a.cat[cat] ??= {}), k);

async function runJobs(jobs: Job[]): Promise<Agg> {
  const { detectPatterns, getMingGongSummary } = await import('../../packages/ziwei-engine/src/patterns');
  const a = newAgg();
  for (const j of jobs) {
    setBrightnessSchool(j.school);
    let c: ZiweiChart;
    try {
      c = generateChart({ year: j.y, month: j.m, day: j.d, hour: j.hour, gender: j.gender }, { leapMonth: j.policy });
    } catch (e) {
      // grouped per date × policy × message; the count says how many hour/gender/school combinations threw
      inc(a.errors, `${j.set} ${j.y}-${j.m}-${j.d} leapMonth=${j.policy}: ${(e as Error).message}`);
      continue;
    }
    a.charts++;
    inc(a.perConfig, `${j.set}|${j.school}|${j.policy}`);
    for (const p of c.palaces) {
      incCat(a, 'palace', p.name);
      incCat(a, 'stem', STEMS[p.stem]);
      incCat(a, 'branch', BRANCHES[p.branch]);
      for (const s of p.stars) {
        incCat(a, 'star', s.name);
        if (s.brightnessRaw) {
          incCat(a, 'brightness', s.brightnessRaw);
          inc((a.brightnessBySchool[j.school] ??= {}), s.brightnessRaw);
        }
        if (s.siHua) incCat(a, 'sihua', s.siHua);
      }
      if (p.selfSihua && p.selfSihua.length) {
        a.selfSihuaPopulated++;
        for (const x of p.selfSihua) incCat(a, 'selfSihua', x.siHua);
      }
      // 十二神 (packages/ziwei-engine/src/shier-shen.ts) — natal anchors: 博士 from 生年干+性别, 岁前/将前 from 生年支
      incCat(a, 'shierShen.boshi', boshiShenName(c.lunarInfo.yearStem, j.gender, p.branch));
      incCat(a, 'shierShen.suiqian', suiQianShenName(c.lunarInfo.yearBranch, p.branch));
      incCat(a, 'shierShen.jiangqian', jiangQianShenName(c.lunarInfo.yearBranch, p.branch));
    }
    incCat(a, 'stem', STEMS[c.lunarInfo.yearStem]);
    incCat(a, 'branch', BRANCHES[c.lunarInfo.yearBranch]);
    for (const gz of [...(c.lunarInfo.fourPillars ?? []), ...(c.lunarInfo.fourPillarsLunar ?? [])]) inc(a.ganzhiPairs, gz);
    incCat(a, 'wuxingJu', c.wuxingJuName);
    if (c.mingZhu) incCat(a, 'mingZhu', c.mingZhu);
    if (c.shenZhu) incCat(a, 'shenZhu', c.shenZhu);
    if (c.yinYangGender) incCat(a, 'yinYangGender', c.yinYangGender);
    for (const dx of c.daXians) {
      incCat(a, 'daXian.palaceName', dx.palaceName);
      if (dx.siHua) { a.daXianSiHuaPopulated++; incCat(a, 'daXianSiHua', `${dx.siHua.lu}/${dx.siHua.quan}/${dx.siHua.ke}/${dx.siHua.ji}`); }
    }
    for (const p of c.palaces) if (p.borrowedFromName) incCat(a, 'borrowedFromName', p.borrowedFromName);
    if (getChildhoodYears(c).length > 0) a.childhoodApplicable++;
    if (c.daXians[0]) inc(a.firstDaXianStartAge, String(c.daXians[0].startAge));
    for (const pt of detectPatterns(c)) {
      incCat(a, 'pattern', pt.name);
      inc((a.patternsBySchool[j.school] ??= {}), pt.name);
    }
    incCat(a, 'mingGongSummary.nature', getMingGongSummary(c).nature);
  }
  setBrightnessSchool('default');
  return a;
}

function mergeAgg(into: Agg, b: Agg) {
  const mergeC = (x: Counter, y: Counter) => { for (const k in y) inc(x, k, y[k]); };
  into.charts += b.charts;
  mergeC(into.errors, b.errors);
  mergeC(into.perConfig, b.perConfig);
  for (const k in b.cat) mergeC((into.cat[k] ??= {}), b.cat[k]);
  for (const k in b.brightnessBySchool) mergeC((into.brightnessBySchool[k] ??= {}), b.brightnessBySchool[k]);
  for (const k in b.patternsBySchool) mergeC((into.patternsBySchool[k] ??= {}), b.patternsBySchool[k]);
  into.childhoodApplicable += b.childhoodApplicable;
  mergeC(into.firstDaXianStartAge, b.firstDaXianStartAge);
  into.selfSihuaPopulated += b.selfSihuaPopulated;
  into.daXianSiHuaPopulated += b.daXianSiHuaPopulated;
  mergeC(into.ganzhiPairs, b.ganzhiPairs);
}

// ─────────────────────────────── declared identifiers ───────────────────────────────
interface Decl { file: string; line: number; what: string }
type DeclMap = Map<string, Map<string, Decl[]>>; // category → id → declarations

function lineOf(file: string, needle: string | RegExp, from = 0): number {
  const lines = readSrc(file).split('\n');
  for (let i = from; i < lines.length; i++) {
    if (typeof needle === 'string' ? lines[i].includes(needle) : needle.test(lines[i])) return i + 1;
  }
  return 0;
}
function quoted(s: string): string[] {
  return [...s.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}
function addDecl(d: DeclMap, cat: string, id: string, decl: Decl) {
  if (!id) return;
  const m = d.get(cat) ?? new Map<string, Decl[]>();
  d.set(cat, m);
  const arr = m.get(id) ?? [];
  if (!arr.some((x) => x.file === decl.file && x.line === decl.line && x.what === decl.what)) arr.push(decl);
  m.set(id, arr);
}
/** Locate the line within `file` (starting at the block start) where `id` is first quoted. */
function declLine(file: string, blockNeedle: string | RegExp, id: string): number {
  const start = lineOf(file, blockNeedle);
  const lines = readSrc(file).split('\n');
  for (let i = Math.max(0, start - 1); i < lines.length; i++) {
    if (lines[i].includes(`'${id}'`) || lines[i].includes(`${id}:`) || lines[i].includes(`'${id}`)) return i + 1;
  }
  return start;
}

const IZTRO_LOCALE = 'node_modules/iztro/lib/i18n/locales';
function loadIztroLocale(lang: 'zh-CN' | 'vi-VN', file: string): Record<string, string> {
  if (file === 'common') return JSON.parse(readSrc(`${IZTRO_LOCALE}/${lang}/common.json`));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(path.join(REPO, IZTRO_LOCALE, lang, `${file}.js`));
  return (mod.default ?? mod) as Record<string, string>;
}

const IZTRO_RING_KEYS = {
  changsheng12: ['changsheng', 'muyu', 'guandai', 'linguan', 'diwang', 'shuai', 'bing', 'si', 'mu', 'jue', 'tai', 'yang'],
  boshi12: ['boshi', 'lishi', 'qinglong', 'xiaohao', 'jiangjun', 'zhoushu', 'faylian', 'xishen', 'bingfu', 'dahao', 'fubing', 'guanfu'],
  suiqian12: ['suijian', 'huiqi', 'sangmen', 'guansuo', 'gwanfu', 'xiaohao', 'suipo', 'longde', 'baihu', 'tiande', 'diaoke', 'bingfu'],
  jiangqian12: ['jiangxing', 'panan', 'suiyi', 'xiishen', 'huagai', 'jiesha', 'zhaisha', 'tiansha', 'zhibei', 'xianchi', 'yuesha', 'wangshen'],
};

function collectDeclared() {
  const d: DeclMap = new Map();
  const iztro = {
    zh: { star: loadIztroLocale('zh-CN', 'star'), palace: loadIztroLocale('zh-CN', 'palace'), brightness: loadIztroLocale('zh-CN', 'brightness'),
      mutagen: loadIztroLocale('zh-CN', 'mutagen'), fiveElementsClass: loadIztroLocale('zh-CN', 'fiveElementsClass'),
      earthlyBranch: loadIztroLocale('zh-CN', 'earthlyBranch'), heavenlyStem: loadIztroLocale('zh-CN', 'heavenlyStem'),
      gender: loadIztroLocale('zh-CN', 'gender'), common: loadIztroLocale('zh-CN', 'common') },
    vi: { star: loadIztroLocale('vi-VN', 'star'), palace: loadIztroLocale('vi-VN', 'palace'), brightness: loadIztroLocale('vi-VN', 'brightness'),
      mutagen: loadIztroLocale('vi-VN', 'mutagen'), fiveElementsClass: loadIztroLocale('vi-VN', 'fiveElementsClass'),
      earthlyBranch: loadIztroLocale('vi-VN', 'earthlyBranch'), heavenlyStem: loadIztroLocale('vi-VN', 'heavenlyStem'),
      gender: loadIztroLocale('vi-VN', 'gender'), common: loadIztroLocale('vi-VN', 'common') },
  };
  const iztroVersion = JSON.parse(readSrc('node_modules/iztro/package.json')).version as string;

  // ── stars ──
  const SD = 'packages/ziwei-engine/src/school-data.ts';
  for (const [id, name] of Object.entries(SCHOOL_STAR_ID_TO_NAME)) addDecl(d, 'star', name, { file: SD, line: declLine(SD, 'SCHOOL_STAR_ID_TO_NAME', name), what: `SCHOOL_STAR_ID_TO_NAME[${id}]` });
  const aliasBlock = readSrc(SD).match(/SCHOOL_NAME_ALIAS[^=]*=\s*\{([^}]*)\}/);
  for (const n of aliasBlock ? [...aliasBlock[1].matchAll(/([^\s,:{}]+)\s*:/g)].map((m) => m[1]) : []) addDecl(d, 'star', n, { file: SD, line: lineOf(SD, 'const SCHOOL_NAME_ALIAS'), what: 'SCHOOL_NAME_ALIAS (shares a brightness row)' });
  for (const n of Object.values(SCHOOL_MING_ZHU_BY_DIZHI)) addDecl(d, 'star', n, { file: SD, line: lineOf(SD, 'SCHOOL_MING_ZHU_BY_DIZHI'), what: 'SCHOOL_MING_ZHU_BY_DIZHI' });
  for (const n of Object.values(SCHOOL_SHEN_ZHU_BY_DIZHI)) addDecl(d, 'star', n, { file: SD, line: lineOf(SD, 'SCHOOL_SHEN_ZHU_BY_DIZHI'), what: 'SCHOOL_SHEN_ZHU_BY_DIZHI' });

  const AL = 'packages/ziwei-engine/src/algorithm.ts';
  const alg = readSrc(AL);
  for (const setName of ['SHA_STARS', 'LUCKY_STARS']) {
    const m = alg.match(new RegExp(`const ${setName} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
    for (const n of m ? quoted(m[1]) : []) addDecl(d, 'star', n, { file: AL, line: declLine(AL, `const ${setName}`, n), what: setName });
  }
  const db = alg.match(/const DEFAULT_BRIGHTNESS[^=]*=\s*\{([\s\S]*?)\n\};/);
  for (const m of db ? db[1].matchAll(/^\s*'([^']+)':\s*\[([^\]]*)\]/gm) : []) {
    addDecl(d, 'star', m[1], { file: AL, line: declLine(AL, 'const DEFAULT_BRIGHTNESS', m[1]), what: 'DEFAULT_BRIGHTNESS key (iztro astro.config only)' });
    for (const v of m[2].split(',').map((x) => x.trim().replace(/'/g, '')).filter(Boolean)) addDecl(d, 'brightness', v, { file: AL, line: declLine(AL, 'const DEFAULT_BRIGHTNESS', m[1]), what: `DEFAULT_BRIGHTNESS['${m[1]}'] value (fed to iztro astro.config, never read back)` });
  }
  for (const n of ['劫煞', '龙德']) addDecl(d, 'star', n, { file: AL, line: lineOf(AL, "sname === '劫煞'"), what: 'pushed from iztro suiqian12/jiangqian12' });
  addDecl(d, 'star', '大耗', { file: AL, line: lineOf(AL, "'大耗');"), what: 'applySchoolDahao pushNatalStar' });
  addDecl(d, 'star', '副旬', { file: AL, line: lineOf(AL, "'副旬');"), what: 'applySchoolFuxun pushNatalStar' });
  for (const n of ['截路', '空亡', '截空', '副截']) addDecl(d, 'star', n, { file: AL, line: lineOf(AL, n === '截路' || n === '截空' ? "if (s.name === '截路')" : "else if (s.name === '空亡')"), what: 'applySchoolJiekong rename' });
  for (let b = 0; b < 12; b++) {
    addDecl(d, 'mingZhu', calcMingZhu(b), { file: AL, line: lineOf(AL, 'const MING_ZHU_TABLE'), what: 'MING_ZHU_TABLE' });
    addDecl(d, 'shenZhu', calcShenZhu(b), { file: AL, line: lineOf(AL, 'const SHEN_ZHU_TABLE'), what: 'SHEN_ZHU_TABLE' });
  }
  for (let s = 0; s < 10; s++) for (const g of GENDERS) addDecl(d, 'yinYangGender', calcYinYangGender(s, g), { file: AL, line: lineOf(AL, 'export function calcYinYangGender'), what: 'calcYinYangGender range' });

  const CO = 'packages/ziwei-engine/src/constants.ts';
  for (const row of Object.values(SI_HUA_TABLE)) for (const n of row) addDecl(d, 'star', n, { file: CO, line: lineOf(CO, 'export const SI_HUA_TABLE'), what: 'SI_HUA_TABLE' });
  for (const n of Object.keys(STAR_DESCRIPTIONS)) addDecl(d, 'star', n, { file: CO, line: lineOf(CO, 'export const STAR_DESCRIPTIONS'), what: 'STAR_DESCRIPTIONS' });
  for (const n of PALACE_NAMES_ORDER) addDecl(d, 'palace', n, { file: CO, line: lineOf(CO, 'export const PALACE_NAMES_ORDER'), what: 'PALACE_NAMES_ORDER (no references outside constants.ts)' });
  for (const n of Object.values(JU_NAMES)) addDecl(d, 'wuxingJu', n, { file: CO, line: lineOf(CO, 'export const JU_NAMES'), what: 'JU_NAMES' });
  STEMS.forEach((s) => addDecl(d, 'stem', s, { file: CO, line: lineOf(CO, 'export const STEMS'), what: 'STEMS' }));
  BRANCHES.forEach((s) => addDecl(d, 'branch', s, { file: CO, line: lineOf(CO, 'export const BRANCHES'), what: 'BRANCHES' }));
  SHICHEN.forEach((s) => addDecl(d, 'shichen', s.name, { file: CO, line: lineOf(CO, `name: '${s.name}'`), what: 'SHICHEN' }));

  // ── brightness ──
  const TY = 'packages/ziwei-engine/src/types.ts';
  const types = readSrc(TY);
  const sb = types.match(/export type StarBrightness = ([^;]+);/);
  for (const v of sb ? quoted(sb[1]) : []) addDecl(d, 'brightness', v, { file: TY, line: lineOf(TY, 'export type StarBrightness'), what: 'StarBrightness union' });
  for (const v of Object.values(BRIGHTNESS_NUM_TO_CN)) addDecl(d, 'brightness', v, { file: SD, line: lineOf(SD, 'export const BRIGHTNESS_NUM_TO_CN:'), what: 'BRIGHTNESS_NUM_TO_CN (7-grade: QS/XD1)' });
  for (const v of Object.values(BRIGHTNESS_NUM_TO_CN_5)) addDecl(d, 'brightness', v, { file: SD, line: lineOf(SD, 'export const BRIGHTNESS_NUM_TO_CN_5'), what: 'BRIGHTNESS_NUM_TO_CN_5 (5-grade: ZZ/XD2)' });
  for (const v of ['庙', '旺', '得', '利', '平', '不', '闲', '陷', '地']) addDecl(d, 'brightness', v, { file: AL, line: lineOf(AL, "const valid: import('./types').StarBrightness[]"), what: 'extractRawBrightness valid list' });

  // ── 四化 ──
  const sh = types.match(/export type SiHua = ([^;]+);/);
  for (const v of sh ? quoted(sh[1]) : []) addDecl(d, 'sihua', v, { file: TY, line: lineOf(TY, 'export type SiHua'), what: 'SiHua union' });
  const PT = 'packages/ziwei-engine/src/patterns.ts';
  for (const v of ['化禄', '化权', '化科', '化忌']) addDecl(d, 'sihuaCompound', v, { file: PT, line: lineOf(PT, v), what: 'compound used in pattern names/descriptions' });

  // ── 十二神 ──
  const SS = 'packages/ziwei-engine/src/shier-shen.ts';
  JIANG_QIAN_SHEN.forEach((n) => addDecl(d, 'shierShen.jiangqian', n, { file: SS, line: lineOf(SS, 'export const JIANG_QIAN_SHEN'), what: 'JIANG_QIAN_SHEN' }));
  SUI_QIAN_SHEN.forEach((n) => addDecl(d, 'shierShen.suiqian', n, { file: SS, line: lineOf(SS, 'export const SUI_QIAN_SHEN'), what: 'SUI_QIAN_SHEN' }));
  BOSHI_SHEN.forEach((n) => addDecl(d, 'shierShen.boshi', n, { file: SS, line: lineOf(SS, 'export const BOSHI_SHEN'), what: 'BOSHI_SHEN' }));

  // ── 格局 names ──
  const pt = readSrc(PT);
  const ptLines = pt.split('\n');
  ptLines.forEach((ln, i) => {
    const m = ln.match(/^\s*name:\s*(.+?),\s*$/);
    if (!m) return;
    const expr = m[1];
    if (expr.startsWith('`')) {
      const tpl = expr.replace(/`/g, '').replace(/\$\{[^}]*\.name\}/g, '{主星}')
        .replace(/\$\{inMing \? '命' : '迁'\}/, '{命|迁}');
      if (tpl.includes('{命|迁}')) {
        for (const x of ['命', '迁']) addDecl(d, 'patternTemplate', tpl.replace('{命|迁}', x), { file: PT, line: i + 1, what: 'template (star = palace major star with that 化)' });
      } else addDecl(d, 'patternTemplate', tpl, { file: PT, line: i + 1, what: 'template (star = palace major star with that 化)' });
    } else {
      // plain 'X' or a ternary  cond ? 'X' : 'Y'  — only the result branches are names (not the compared value)
      const names = expr.includes('?') ? quoted(expr.slice(expr.indexOf('?'))) : quoted(expr);
      for (const n of names) addDecl(d, 'pattern', n, { file: PT, line: i + 1, what: 'detectPatterns name' });
    }
  });
  const ng = pt.match(/const natureMap[^=]*=\s*\{([\s\S]*?)\};/);
  for (const m of ng ? ng[1].matchAll(/:\s*'([^']+)'/g) : []) addDecl(d, 'mingGongSummary.nature', m[1], { file: PT, line: lineOf(PT, `'${m[1]}'`, lineOf(PT, 'const natureMap') - 1), what: 'getMingGongSummary natureMap' });
  addDecl(d, 'mingGongSummary.nature', '空宫', { file: PT, line: lineOf(PT, ": '空宫'"), what: 'getMingGongSummary nature for a 命宫 with no major star' });

  // ── 运限 view labels ──
  const YC = 'packages/ziwei-engine/src/yunxian-context.ts';
  const yv = readSrc(YC).match(/export type YunxianView = ([^;]+);/);
  const VIEW_LABEL: Record<string, string> = { mingpan: '本命', daxian: '大限', liunian: '流年', xiaoxian: '小限', liuyue: '流月', liuri: '流日', liushi: '流时' };
  const yunxianViews = yv ? quoted(yv[1]) : [];
  for (const v of yunxianViews) addDecl(d, 'yunxianLabel', VIEW_LABEL[v] ?? v, { file: YC, line: lineOf(YC, 'export type YunxianView'), what: `YunxianView '${v}'` });
  addDecl(d, 'yunxianLabel', '童限', { file: YC, line: lineOf(YC, 'export const CHILDHOOD_DAXIAN_INDEX'), what: 'CHILDHOOD_DAXIAN_INDEX / getChildhoodYears' });
  const TN = 'apps/web/components/TimeNav.tsx';
  for (const lbl of ['本命', '大限', '流年']) addDecl(d, 'yunxianLabel', lbl, { file: TN, line: lineOf(TN, new RegExp(`^\\s*${lbl}\\s*$`)) || lineOf(TN, lbl), what: 'TimeNav tab label' });

  // ── concepts emitted as structure ──
  addDecl(d, 'concept', '自化', { file: TY, line: lineOf(TY, 'selfSihua?: SelfSihuaMark[]'), what: 'Palace.selfSihua (宫干自化)' });

  // ── iztro data ──
  const zhStar = iztro.zh.star, viStar = iztro.vi.star;
  const ringKeys = new Set(Object.values(IZTRO_RING_KEYS).flat());
  const hsSrc = readSrc('node_modules/iztro/lib/star/horoscopeStar.js');
  // flow (运限) star keys: decadal 运X, yearly 流X, monthly 月X, daily 日X, hourly 时X (horoscopeStar.js:38-87).
  // The natal keys reused there (…Min, tianxi) and the yearly 年解 (nianjie, same name as the natal 年解) stay in 'star'.
  const flowKeys = new Set([...hsSrc.matchAll(/t\)\('([a-z]+)'\)/g)].map((m) => m[1]).filter((k) => /^(yun|liu|yue|ri|shi)/.test(k) && !k.endsWith('Min')));
  const iztroOf: Record<string, { key: string; zh: string; vi: string }[]> = {};
  const addIz = (cat: string, key: string, zh: string, vi: string) => { (iztroOf[`${cat}|${zh}`] ??= []).push({ key, zh, vi }); };
  for (const [k, zh] of Object.entries(zhStar)) {
    const cat = flowKeys.has(k) ? 'flowStar' : ringKeys.has(k) ? null : 'star';
    if (cat) addIz(cat, k, zh, viStar[k]);
  }
  for (const [ring, keys] of Object.entries(IZTRO_RING_KEYS)) {
    const cat = ring === 'changsheng12' ? 'changsheng12' : `shierShen.${ring.replace('12', '')}`;
    for (const k of keys) addIz(cat, k, zhStar[k], viStar[k]);
  }
  // iztro boshi12/suiqian12/jiangqian12 values that this engine also places as natal stars
  for (const k of ['dahao', 'longde', 'jiesha', 'huagai', 'xianchi', 'tiande']) addIz('star', k, zhStar[k], viStar[k]);
  for (const [k, zh] of Object.entries(iztro.zh.palace)) addIz('palace', k, zh, iztro.vi.palace[k]);
  for (const [k, zh] of Object.entries(iztro.zh.brightness)) addIz('brightness', k, zh, iztro.vi.brightness[k]);
  for (const [k, zh] of Object.entries(iztro.zh.mutagen)) addIz('sihua', k, zh, iztro.vi.mutagen[k]);
  for (const [k, zh] of Object.entries(iztro.zh.fiveElementsClass)) addIz('wuxingJu', k, zh, iztro.vi.fiveElementsClass[k]);
  for (const [k, zh] of Object.entries(iztro.zh.earthlyBranch)) addIz('branch', k, zh, iztro.vi.earthlyBranch[k]);
  for (const [k, zh] of Object.entries(iztro.zh.heavenlyStem)) addIz('stem', k, zh, iztro.vi.heavenlyStem[k]);
  const commonYunxian = ['decadal', 'childhood', 'yearly', 'monthly', 'daily', 'hourly', 'turn'];
  for (const k of commonYunxian) addIz('yunxianLabel', k, iztro.zh.common[k], iztro.vi.common[k]);

  return { d, iztroOf, iztroVersion, yunxianViews, flowKeys: [...flowKeys].sort() };
}

// ─────────────────────────────── proven-unreachable (code arguments) ───────────────────────────────
/**
 * Each entry MUST carry a code argument. Category|id → argument. Only consulted when the sweep did NOT
 * observe the identifier; if the sweep ever observes one of these the script fails loudly.
 */
const PROVEN_UNREACHABLE: Record<string, string> = {
  'brightness|地':
    'Every Star.brightnessRaw written by generateChart is extractRawBrightness(rb) with rb = schoolStarBrightness(...) ' +
    '(algorithm.ts:367, 399, 423, 438, 440, 524, 536, 552); 劫煞/龙德 are pushed with no brightness (algorithm.ts:564). ' +
    'schoolStarBrightness returns BRIGHTNESS_NUM_TO_CN_BY_SCHOOL[school][v] (school-data.ts:305), whose maps contain only ' +
    '庙旺得利平不陷 (school-data.ts:229-231) or 庙旺平闲陷 (school-data.ts:238-240) — no 地. iztro\'s own brightness ' +
    '(which received 平 in place of XD1 地, algorithm.ts:57-58) is never read (algorithm.ts:518-553 ignore s.brightness).',
  'star|截路':
    'applySchoolJiekong renames every star named 截路 to 截空 in every palace (algorithm.ts:414-417) and is called ' +
    'unconditionally (algorithm.ts:651); nothing after it adds stars except 大耗 (algorithm.ts:404) and 副旬 (algorithm.ts:450).',
  'star|空亡':
    'applySchoolJiekong renames every star named 空亡 to 副截 (algorithm.ts:417), called unconditionally (algorithm.ts:651); ' +
    'nothing after it adds stars except 大耗 and 副旬.',
  'concept|自化':
    'generateChart never populates Palace.selfSihua: the palace literal (algorithm.ts:569-578) has no selfSihua and no later ' +
    'step assigns it (algorithm.ts:641 "宫干自化已下线"; the sihua.ts import is commented out at algorithm.ts:14).',
};

// ─────────────────────────────── main ───────────────────────────────
function argVal(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function runParallel(jobs: Job[], workers: number): Promise<Agg> {
  if (workers <= 1) return runJobs(jobs);
  const shards = Array.from({ length: workers }, (_, k) => k);
  const results = await Promise.all(shards.map((k) => new Promise<Agg>((resolve, reject) => {
    const child = fork(__filename, ['--worker', String(k), String(workers)], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
    child.on('message', (m) => resolve(m as Agg));
    child.on('error', reject);
    child.on('exit', (code) => { if (code !== 0) reject(new Error(`worker ${k} exited ${code}`)); });
  })));
  const all = newAgg();
  for (const r of results) mergeAgg(all, r);
  return all;
}

const sortCounter = (c: Counter) => Object.fromEntries(Object.entries(c).sort(([a, x], [b, y]) => y - x || (a < b ? -1 : a > b ? 1 : 0)));
const sortKeys = <T>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

async function main() {
  const wi = process.argv.indexOf('--worker');
  if (wi >= 0) {
    const k = Number(process.argv[wi + 1]);
    const n = Number(process.argv[wi + 2]);
    const { jobs } = buildJobs();
    const res = await runJobs(jobs.filter((_, i) => i % n === k));
    process.send!(res, () => process.exit(0));
    return;
  }

  const workers = Number(argVal('workers') ?? Math.max(1, Math.min(10, os.cpus().length - 1)));
  const { jobs, base, leap, boundary } = buildJobs();
  const agg = await runParallel(jobs, workers);
  setBrightnessSchool('default');

  const { d, iztroOf, iztroVersion, yunxianViews, flowKeys } = collectDeclared();

  // observed patterns that match a declared template become pattern-template observations
  const templateObs: Counter = {};
  const templateRe: [string, RegExp][] = [...(d.get('patternTemplate')?.keys() ?? [])].map((t) => [t, new RegExp(`^${t.replace('{主星}', '(.+)')}$`)]);
  for (const [name, n] of Object.entries(agg.cat['pattern'] ?? {})) {
    for (const [t, re] of templateRe) if (re.test(name) && !d.get('pattern')?.has(name)) inc(templateObs, t, n);
  }

  // ── assemble identifier rows ──
  const CATS = ['star', 'flowStar', 'changsheng12', 'palace', 'brightness', 'sihua', 'sihuaCompound', 'stem', 'branch', 'shichen',
    'wuxingJu', 'yinYangGender', 'shierShen.boshi', 'shierShen.suiqian', 'shierShen.jiangqian', 'pattern', 'patternTemplate',
    'yunxianLabel', 'mingGongSummary.nature', 'concept'];
  const rows: {
    category: string; id: string; reachability: string; observedCount: number;
    declaredIn: string[]; iztro: { key: string; zh: string; vi: string }[]; argument?: string;
  }[] = [];
  for (const cat of CATS) {
    const ids = new Set<string>();
    for (const k of Object.keys(cat === 'patternTemplate' ? templateObs : agg.cat[cat] ?? {})) {
      if (cat === 'pattern' && !d.get('pattern')?.has(k) && templateRe.some(([, re]) => re.test(k))) continue; // expansions → template row
      ids.add(k);
    }
    for (const k of d.get(cat)?.keys() ?? []) ids.add(k);
    for (const key of Object.keys(iztroOf)) if (key.startsWith(`${cat}|`)) ids.add(key.slice(cat.length + 1));
    for (const id of [...ids].sort()) {
      const observed = cat === 'patternTemplate' ? templateObs[id] ?? 0 : agg.cat[cat]?.[id] ?? 0;
      const decls = d.get(cat)?.get(id) ?? [];
      const iz = iztroOf[`${cat}|${id}`] ?? [];
      const arg = PROVEN_UNREACHABLE[`${cat}|${id}`];
      if (observed > 0 && arg) throw new Error(`PROVEN_UNREACHABLE contradicted by sweep: ${cat}|${id}`);
      const reach = observed > 0 ? 'runtime-observed' : arg ? 'proven-unreachable' : decls.length ? 'declared-but-not-observed' : 'iztro-only';
      rows.push({
        category: cat, id, reachability: reach, observedCount: observed,
        declaredIn: decls.map((x) => `${x.file}:${x.line} ${x.what}`), iztro: iz, ...(arg ? { argument: arg } : {}),
      });
    }
  }

  const byCatReach: Record<string, Counter> = {};
  const byReach: Counter = {};
  for (const r of rows) { inc((byCatReach[r.category] ??= {}), r.reachability); inc(byReach, r.reachability); }

  const perConfig: Record<string, number> = sortKeys(agg.perConfig);
  const perSchoolPolicy: Counter = {};
  for (const [k, n] of Object.entries(agg.perConfig)) { const [, s, p] = k.split('|'); inc(perSchoolPolicy, `${s}|${p}`, n); }

  // SB table value histograms (what each school CAN produce, independent of the sweep)
  const sbHist: Record<string, Counter> = {};
  for (const s of SCHOOLS) {
    const tbl = (SCHOOL_AX as unknown as Record<string, number[][]>)[`SB_${s}`];
    const h: Counter = {};
    tbl.forEach((row, sid) => { if (sid === 0) return; row.forEach((v, col) => { if (col === 0 || !v) return; const name = SCHOOL_STAR_ID_TO_NAME[sid]; if (!name) return; inc(h, BRIGHTNESS_NUM_TO_CN_BY_SCHOOL[s][v] ?? `unmapped:${v}`); }); });
    sbHist[s] = sortCounter(h);
  }

  const out = {
    tool: 'scripts/i18n/collect-identifiers.ts',
    iztroVersion,
    coverage: {
      engineEntry: 'generateChart(birthInfo, { leapMonth }) with setBrightnessSchool(school) before each chart; reset to default at exit',
      sets: {
        'base-grid': {
          description: 'Same dates as .claude/skills/chart/chart.ts --sweep: years 1960..2010 step 7 (1960,1967,1974,1981,1988,1995,2002,2009) × months 1,4,7,10 × days 5,15,25, plus its 8 extra dates; hours extended to all 12; both genders.',
          dates: base.length,
          extraDates: base.slice(96).map((x) => x.join('-')),
          leapDatesInSet: base.filter(isRawLeap).map((x) => `${x.join('-')} = 农历${lunarLabel(x)}`),
        },
        'leap-month': {
          description: 'Leap lunar months that START between 1960-01-01 and 2033-12-31, found by scanning every solar day 1960-01-01..2034-03-31 with lunar-javascript; requested 2020闰4 / 2023闰2 / 2017闰6 first, then the first occurrence of each other leap-month number; lunar days 1, 15, 16 and last day.',
          allLeapMonthsFound: leap.allLeapMonthsFound,
          chosen: leap.chosen,
          dates: leap.dates.map((x) => ({ leapMonth: x.key, lunarDay: x.lunarDay, solar: x.ymd.join('-'), verifiedLunar: lunarLabel(x.ymd), isRawLeap: isRawLeap(x.ymd),
            policies: Object.fromEntries(POLICIES.map((p) => { const e = resolveEffectiveLunarDate(x.ymd[0], x.ymd[1], x.ymd[2], p); return [p, `${e.lunarYear}-${e.isLeapMonth ? '闰' : ''}${e.lunarMonth}-${e.lunarDay}`]; })) })),
        },
        boundary: {
          fixed: boundary.fixed.map((x) => ({ solar: x.ymd.join('-'), lunar: lunarLabel(x.ymd), why: x.why })),
          lateZi: boundary.lateZi.map((x) => ({ input: x.input, chartingDay: x.ymd.join('-'), lunar: lunarLabel(x.ymd), why: x.why })),
        },
      },
      policyRule: 'Non-leap dates are charted under split only (leap policy is a no-op there: algorithm.ts:158-167, 486); raw-leap dates under all 4 policies.',
      schools: SCHOOLS,
      leapPolicies: POLICIES,
      genders: [...GENDERS],
      hours: HOURS.map((h) => `${h}=${BRANCHES[h]}`),
      jobs: jobs.length,
      chartsTotal: agg.charts,
      errors: sortCounter(agg.errors),
      chartsPerSetSchoolPolicy: perConfig,
      chartsPerSchoolPolicy: sortKeys(perSchoolPolicy),
      childhoodApplicableCharts: agg.childhoodApplicable,
      firstDaXianStartAge: sortKeys(agg.firstDaXianStartAge),
      selfSihuaPopulatedPalaces: agg.selfSihuaPopulated,
      daXianSiHuaPopulated: agg.daXianSiHuaPopulated,
      distinctGanzhiPairsInFourPillars: Object.keys(agg.ganzhiPairs).length,
    },
    observed: sortKeys(Object.fromEntries(Object.entries(agg.cat).map(([k, v]) => [k, sortCounter(v)]))),
    observedPatternTemplates: sortCounter(templateObs),
    brightnessBySchool: sortKeys(Object.fromEntries(Object.entries(agg.brightnessBySchool).map(([k, v]) => [k, sortCounter(v)]))),
    brightnessTableValuesBySchool: sbHist,
    patternsBySchool: sortKeys(Object.fromEntries(Object.entries(agg.patternsBySchool).map(([k, v]) => [k, sortCounter(v)]))),
    yunxianViews,
    iztroFlowStarKeys: flowKeys,
    identifierCountsByCategory: sortKeys(Object.fromEntries(Object.entries(byCatReach).map(([k, v]) => [k, { total: Object.values(v).reduce((x, y) => x + y, 0), ...sortKeys(v) }]))),
    reachabilityTotals: sortKeys(byReach),
    rows,
  };
  const json = JSON.stringify(out, null, 2);
  const outPath = argVal('out');
  if (outPath) fs.writeFileSync(outPath, json + '\n');
  else process.stdout.write(json + '\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
