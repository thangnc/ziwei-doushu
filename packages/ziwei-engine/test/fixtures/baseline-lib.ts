/**
 * 基线（change-detector）fixture 的共用生成逻辑 —— 生成器与回归测试共用同一份代码。
 *
 * 用途：在本地化 / 重构前钉住排盘引擎、格局识别、出生时间换算的现有输出，任何变化都会被测试发现。
 * 注意：fixture 只用来「发现变化」，不证明正确；更新 fixture 必须附 chart-diff-reviewer 报告与依据，
 *       见 packages/ziwei-engine/test/fixtures/README.md。
 *
 * 本文件只读：不写任何文件。写盘只在 generate-baselines.ts --write 里发生。
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import * as nodeModule from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// patterns.ts 带 `server-only`（仓库没装这个包，Next 构建时才有）；与 patterns-sihua-bonus.test.ts 同法桩成空模块。
// module.registerHooks 需要 Node 22.15+ / 23.5+。
type HookResult = { url?: string; format?: string; source?: string; shortCircuit?: boolean };
const SERVER_ONLY_STUB = 'data:text/javascript,';
(nodeModule as unknown as {
  registerHooks(h: {
    resolve(s: string, c: unknown, next: (s: string, c: unknown) => HookResult): HookResult;
    load(u: string, c: unknown, next: (u: string, c: unknown) => HookResult): HookResult;
  }): void;
}).registerHooks({
  resolve: (s, c, next) => (s === 'server-only' ? { url: SERVER_ONLY_STUB, shortCircuit: true } : next(s, c)),
  load: (u, c, next) => (u === SERVER_ONLY_STUB ? { format: 'commonjs', source: '', shortCircuit: true } : next(u, c)),
});

export const FIXTURE_SCHEMA_VERSION = 1;
export const GENERATOR_VERSION = '1.0.0';

export const FIXTURE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(FIXTURE_DIR, '../../../..'); // packages/ziwei-engine/test/fixtures -> repo root (hoisted node_modules, git)

export type FixtureName = 'engine-baseline.zh' | 'patterns-baseline.zh' | 'birthtime-baseline.zh';
export const FIXTURES: Record<FixtureName, { bodyFile: string; metaFile: string }> = {
  'engine-baseline.zh': { bodyFile: 'engine-baseline.zh.jsonl.gz', metaFile: 'engine-baseline.zh.meta.json' },
  'patterns-baseline.zh': { bodyFile: 'patterns-baseline.zh.jsonl.gz', metaFile: 'patterns-baseline.zh.meta.json' },
  'birthtime-baseline.zh': { bodyFile: 'birthtime-baseline.zh.jsonl.gz', metaFile: 'birthtime-baseline.zh.meta.json' },
};

// ─────────────────────────── 输入网格 ───────────────────────────

type Gender = 'male' | 'female';
type Leap = 'split' | 'next-month' | 'prev-month' | 'origin-month';
type School = 'QS' | 'XD1' | 'ZZ' | 'XD2';
interface EngineCase { key: string; year: number; month: number; day: number; hour: number; gender: Gender; leap: Leap; school: School }

const GENDERS: Gender[] = ['male', 'female'];
const SCHOOLS: School[] = ['QS', 'XD1', 'ZZ', 'XD2'];
const LEAPS: Leap[] = ['split', 'next-month', 'prev-month', 'origin-month'];

/** 闰月出生日期（公历）。生成时会断言它们确实落在农历闰月里，见 assertLeapDates。 */
export const LEAP_MONTH_DATES: [number, number, number][] = [
  [2020, 5, 25],  // 闰四月
  [2020, 6, 10],  // 闰四月下半
  [2023, 3, 25],  // 闰二月
  [2017, 7, 30],  // 闰六月
  [2017, 8, 15],  // 闰六月下半
  [1987, 7, 30],  // 闰六月
  [1995, 9, 30],  // 闰八月
];

/** 年界、月界、立春 / 正月初一 交界、闰日 */
const BOUNDARY_DATES: [number, number, number][] = [
  [1984, 2, 4], [1984, 2, 5], [1999, 2, 4], [1999, 2, 11], [1999, 2, 16], [2001, 1, 23], [2001, 1, 24],
  [1990, 1, 31], [1990, 12, 31], [1991, 1, 1], [2000, 2, 28], [2000, 2, 29], [2000, 3, 1], [2001, 2, 28],
  [2004, 3, 21], [2006, 8, 24], [2023, 4, 19], [2026, 11, 7],
];

/**
 * 引擎基线输入：
 *  A. 主网格 1960–2010（步长 7 年）× 月 1/4/7/10 × 日 5/15/25 × 时辰 0/3/6/9 × 男女 —— 默认口径（QS, split），共 832 盘
 *  B. 边界日期 × 全部 12 时辰 × 男女 —— 默认口径
 *  C. 闰月日期 × 4 种闰月口径 × 时辰 0/6 × 男女 —— QS
 *  D. 4 种亮度流派 × 主网格子集（1960–2010 步长 14 年 × 月 1/7 × 日 15 × 时辰 0/6 × 男女）
 */
export function engineCases(): EngineCase[] {
  const out: EngineCase[] = [];
  const add = (y: number, m: number, d: number, h: number, g: Gender, leap: Leap, school: School, group: string) =>
    out.push({ key: `${group}|${school}|${leap}|${y}-${m}-${d}|h${h}|${g}`, year: y, month: m, day: d, hour: h, gender: g, leap, school });

  for (let y = 1960; y <= 2010; y += 7) for (let m = 1; m <= 12; m += 3) for (let d = 5; d <= 26; d += 10)
    for (let h = 0; h < 12; h += 3) for (const g of GENDERS) add(y, m, d, h, g, 'split', 'QS', 'A');
  for (const [y, m, d] of BOUNDARY_DATES) for (let h = 0; h < 12; h++) for (const g of GENDERS) add(y, m, d, h, g, 'split', 'QS', 'B');
  for (const [y, m, d] of LEAP_MONTH_DATES) for (const leap of LEAPS) for (const h of [0, 6]) for (const g of GENDERS) add(y, m, d, h, g, leap, 'QS', 'C');
  for (const school of SCHOOLS) for (let y = 1960; y <= 2010; y += 14) for (const m of [1, 7]) for (const h of [0, 6]) for (const g of GENDERS)
    add(y, m, 15, h, g, 'split', school, 'D');
  return out;
}

// ─────────────────────────── 序列化 ───────────────────────────

/** 依赖「今天」的字段：currentAge / currentDaXianIndex / palaces[].isCurrentDaXian（algorithm.ts:589–600, 643–671）。基线一律剔除。 */
const DATE_DEPENDENT_KEYS = new Set(['currentAge', 'currentDaXianIndex', 'isCurrentDaXian']);

function stripDateDependent(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripDateDependent);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (DATE_DEPENDENT_KEYS.has(k) || v === undefined) continue;
      out[k] = stripDateDependent(v);
    }
    return out;
  }
  return value;
}

export const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

// ─────────────────────────── 生成 body ───────────────────────────

async function loadEngine() {
  const algorithm = await import('../../src/algorithm');
  const patterns = await import('../../src/patterns');
  return { ...algorithm, detectPatterns: patterns.detectPatterns };
}

export interface Body { name: FixtureName; text: string; records: number }

export async function buildEngineAndPatternBodies(): Promise<[Body, Body]> {
  const { generateChart, setBrightnessSchool, resolveEffectiveLunarDate, detectPatterns } = await loadEngine();
  assertLeapDates(resolveEffectiveLunarDate);
  const engineLines: string[] = [];
  const patternLines: string[] = [];
  try {
    for (const c of engineCases()) {
      setBrightnessSchool(c.school);
      let chartJson: string;
      let patternJson: string;
      try {
        const chart = generateChart({ year: c.year, month: c.month, day: c.day, hour: c.hour, gender: c.gender }, { leapMonth: c.leap });
        chartJson = JSON.stringify(stripDateDependent(chart));
        patternJson = JSON.stringify(detectPatterns(chart));
      } catch (e) {
        chartJson = JSON.stringify({ error: `${(e as Error).name}: ${(e as Error).message}` });
        patternJson = chartJson;
      }
      engineLines.push(`${JSON.stringify(c.key)}\t${chartJson}`);
      patternLines.push(`${JSON.stringify(c.key)}\t${patternJson}`);
    }
  } finally {
    setBrightnessSchool('default'); // 亮度流派是全局状态，必须还原
  }
  return [
    { name: 'engine-baseline.zh', text: engineLines.join('\n') + '\n', records: engineLines.length },
    { name: 'patterns-baseline.zh', text: patternLines.join('\n') + '\n', records: patternLines.length },
  ];
}

/**
 * 闰月日期必须真的在农历闰月里，否则 C 组覆盖是假的。
 * 用 resolveEffectiveLunarDate 的 rawLunarMonth（lunar-javascript 原值，闰月为负）判断；
 * getLunarInfo 的 isLeapMonth 是套用闰月口径之后的结果，不能用来判断「是否闰月出生」。
 */
function assertLeapDates(resolve: (y: number, m: number, d: number, p: 'split') => { rawLunarMonth: number }) {
  for (const [y, m, d] of LEAP_MONTH_DATES) {
    const { rawLunarMonth } = resolve(y, m, d, 'split');
    if (rawLunarMonth >= 0) throw new Error(`LEAP_MONTH_DATES entry ${y}-${m}-${d} is not in a lunar leap month (rawLunarMonth=${rawLunarMonth})`);
  }
}

/**
 * 出生时间换算基线：share.ts 的 formToBirthInfo / calcTrueSolarBranch（今天的表单口径）。
 * 城市 × 日期 × 每个时辰边界附近（真太阳边界折回钟表时间后 ±2 分钟）+ 晚子时 + 不知时辰 + 不填出生地。
 */
const CN_CITIES: [string, string, number][] = [
  ['北京市', '北京', 116.4], ['上海市', '上海', 121.47], ['黑龙江省', '哈尔滨', 126.63],
  ['新疆维吾尔自治区', '乌鲁木齐', 87.62], ['新疆维吾尔自治区', '喀什', 75.99], ['西藏自治区', '拉萨', 91.13],
];
const BIRTHTIME_DATES: [number, number, number][] = [
  [1988, 7, 1],   // 中国夏令时期间（表单不自动扣除，钉住现状）
  [1990, 1, 31], [1990, 12, 31], [2000, 2, 28], [2000, 2, 29], [2001, 2, 28], [2024, 11, 3], [2024, 2, 12],
];

export async function buildBirthtimeBody(): Promise<Body> {
  const { formToBirthInfo, calcTrueSolarBranch } = await import('../../src/share');
  type Form = Parameters<typeof formToBirthInfo>[0];
  const lines: string[] = [];
  const emit = (key: string, form: Form, extra: Record<string, unknown> = {}) => {
    let out: unknown;
    try { out = formToBirthInfo(form); } catch (e) { out = { error: `${(e as Error).name}: ${(e as Error).message}` }; }
    lines.push(`${JSON.stringify(key)}\t${JSON.stringify({ out, ...extra })}`);
  };
  const base = (y: number, m: number, d: number): Form => ({
    name: '', year: String(y), month: String(m), day: String(d), clockHour: '0', clockMinute: '0',
    unknownTime: false, province: '', city: '', longitude: 120, gender: 'female',
  });

  for (const [prov, city, lng] of CN_CITIES) {
    const offset = (lng - 120) * 4;
    const clockMinutes = new Set<number>();
    for (let b = 0; b < 12; b++) {
      const solarBoundary = (b * 120 + 23 * 60) % 1440; // 23:00, 01:00, … 21:00
      const clock = Math.round(solarBoundary - offset);
      for (let k = -2; k <= 2; k++) clockMinutes.add(((clock + k) % 1440 + 1440) % 1440);
    }
    for (const [y, m, d] of BIRTHTIME_DATES) {
      for (const cm of [...clockMinutes].sort((a, b) => a - b)) {
        const hh = Math.floor(cm / 60), mm = cm % 60;
        const form = { ...base(y, m, d), clockHour: String(hh), clockMinute: String(mm), province: prov, city, longitude: lng };
        emit(`city|${city}|${y}-${m}-${d}|${hh}:${mm}`, form, { calcTrueSolarBranch: calcTrueSolarBranch(hh, mm, lng) });
      }
    }
  }
  // 不填出生地（不做真太阳时校正）：每小时整点与 23:00–23:59 晚子时
  for (const [y, m, d] of BIRTHTIME_DATES) {
    for (let h = 0; h < 24; h++) emit(`noloc|${y}-${m}-${d}|${h}:00`, { ...base(y, m, d), clockHour: String(h), clockMinute: '0' });
    for (const mm of [0, 30, 59]) emit(`noloc|${y}-${m}-${d}|23:${mm}`, { ...base(y, m, d), clockHour: '23', clockMinute: String(mm) });
    emit(`unknown|${y}-${m}-${d}`, { ...base(y, m, d), unknownTime: true });
  }
  return { name: 'birthtime-baseline.zh', text: lines.join('\n') + '\n', records: lines.length };
}

export async function buildAllBodies(): Promise<Body[]> {
  const [engine, patterns] = await buildEngineAndPatternBodies();
  return [engine, patterns, await buildBirthtimeBody()];
}

// ─────────────────────────── 元数据（与 body 分离，只用于环境说明） ───────────────────────────

function pkgVersion(name: string): string {
  try { return JSON.parse(readFileSync(path.join(REPO_ROOT, 'node_modules', name, 'package.json'), 'utf8')).version; } catch { return 'unknown'; }
}
function cmd(c: string): string {
  try { return execSync(c, { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return 'unknown'; }
}

export interface Environment {
  node: string; npm: string; icu: string; tz: string; unicode: string;
  platform: string; osRelease: string; arch: string;
  containerImage: string; runtime: string; iztro: string; lunarJavascript: string;
}

export function currentEnvironment(): Environment {
  return {
    node: process.version,
    npm: cmd('npm --version'),
    icu: process.versions.icu ?? 'unknown',
    tz: process.versions.tz ?? 'unknown',
    unicode: process.versions.unicode ?? 'unknown',
    platform: process.platform,
    osRelease: os.release(),
    arch: process.arch,
    containerImage: process.env.BASELINE_IMAGE ?? 'none (local)',
    runtime: process.env.BASELINE_RUNTIME ?? (process.env.CI ? 'ci' : 'local'),
    iztro: pkgVersion('iztro'),
    lunarJavascript: pkgVersion('lunar-javascript'),
  };
}

export interface FixtureMeta {
  fixture: FixtureName;
  fixtureSchemaVersion: number;
  generatorVersion: string;
  records: number;
  bodyBytes: number;
  storedBytes?: number;
  bodySha256: string;
  gitCommit: string;
  generatedAt: string;
  environment: Environment;
}

export function buildMeta(body: Body): FixtureMeta {
  return {
    fixture: body.name,
    fixtureSchemaVersion: FIXTURE_SCHEMA_VERSION,
    generatorVersion: GENERATOR_VERSION,
    records: body.records,
    bodyBytes: Buffer.byteLength(body.text, 'utf8'),
    bodySha256: sha256(body.text),
    gitCommit: process.env.BASELINE_GIT_COMMIT ?? cmd('git rev-parse HEAD'),
    generatedAt: new Date().toISOString(),
    environment: currentEnvironment(),
  };
}

// ─────────────────────────── body 编码 ───────────────────────────
// body 以 gzip 存放（引擎基线未压缩约 12 MB）。校验与 sha256 一律基于解压后的 UTF-8 文本，
// 因此不同 zlib 版本产出的压缩字节不同也不会造成误报。
export const encodeBody = (text: string) => gzipSync(Buffer.from(text, 'utf8'), { level: 9 });
export const readBody = (file: string) => gunzipSync(readFileSync(file)).toString('utf8');

// ─────────────────────────── 校验（只读） ───────────────────────────

const ENV_KEYS: (keyof Environment)[] = ['node', 'npm', 'icu', 'tz', 'unicode', 'platform', 'arch', 'iztro', 'lunarJavascript', 'containerImage'];

/**
 * 只比较 body（逐字节 + sha256）。环境 / git / 时间差异只打印报告，从不导致失败、从不写文件。
 * 返回 true = body 一致。
 */
export function verifyFixture(name: FixtureName, generated: Body): boolean {
  const { bodyFile, metaFile } = FIXTURES[name];
  let committed: string;
  let meta: FixtureMeta | null = null;
  try { committed = readBody(path.join(FIXTURE_DIR, bodyFile)); } catch {
    console.error(`  ✗ ${name}: committed fixture ${bodyFile} is missing. Generate it explicitly (see fixtures/README.md); tests never create fixtures.`);
    return false;
  }
  try { meta = JSON.parse(readFileSync(path.join(FIXTURE_DIR, metaFile), 'utf8')); } catch { console.warn(`  ! ${name}: ${metaFile} missing or unreadable (metadata only; not a failure)`); }

  // 环境差异报告（信息性）
  if (meta) {
    const now = currentEnvironment();
    const diffs = ENV_KEYS.filter((k) => meta!.environment[k] !== now[k]);
    if (diffs.length) {
      console.warn(`  ! ${name}: ENVIRONMENT MISMATCH vs fixture metadata (informational; only the body decides pass/fail):`);
      for (const k of diffs) console.warn(`      ${k}: fixture=${meta.environment[k]}  current=${now[k]}`);
    }
    if (meta.bodySha256 !== sha256(committed)) {
      console.warn(`  ! ${name}: committed body does not match its own metadata checksum — the body file was edited without regenerating metadata.`);
    }
  }

  if (committed === generated.text) {
    console.log(`  ✓ ${name}: ${generated.records} records, body sha256 ${sha256(generated.text).slice(0, 16)}… matches`);
    return true;
  }
  const a = committed.split('\n'), b = generated.text.split('\n');
  console.error(`  ✗ ${name}: BODY MISMATCH (committed ${a.length - 1} records, generated ${b.length - 1}). Investigate; do not regenerate without review.`);
  let shown = 0;
  for (let i = 0; i < Math.max(a.length, b.length) && shown < 5; i++) {
    if (a[i] !== b[i]) {
      shown++;
      console.error(`    line ${i + 1}:\n      committed: ${(a[i] ?? '<none>').slice(0, 300)}\n      generated: ${(b[i] ?? '<none>').slice(0, 300)}`);
    }
  }
  return false;
}
