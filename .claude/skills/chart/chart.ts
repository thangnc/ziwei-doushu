/**
 * Chart dump CLI for Claude Code (skill `chart` and agent `chart-diff-reviewer`).
 *
 * Single chart, from clock time (goes through formToBirthInfo: true solar time + late-子时 day change):
 *   npx tsx .claude/skills/chart/chart.ts --date 1990-05-09 --time 23:30 --gender female [--lng 100]
 * Single chart, from a branch index directly (0=子 … 11=亥, no time correction):
 *   npx tsx .claude/skills/chart/chart.ts --date 1990-05-10 --hour 0 --gender female
 * Options: --leap split|next-month|prev-month|origin-month   --school QS|XD1|ZZ|XD2   --json
 *
 * Sweep (deterministic, one line per chart, for before/after diffs):
 *   npx tsx .claude/skills/chart/chart.ts --sweep [--root /path/to/other/checkout] > out.txt
 *   --root loads the engine (packages/ziwei-engine/src, or lib/ziwei in pre-monorepo checkouts) from
 *   another checkout (e.g. a git worktree of the base branch).
 */
import path from 'node:path';
import { existsSync } from 'node:fs';
import * as nodeModule from 'node:module';
import { pathToFileURL } from 'node:url';

// patterns.ts / famous.ts import 'server-only', which isn't installed outside a Next build.
// Stub it the same way packages/ziwei-engine/test/patterns-sihua-bonus.test.ts does (Node 22.15+).
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

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (name: string) => args.includes(`--${name}`);

const BR = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

const root = path.resolve(opt('root') ?? process.cwd());
// The engine lives in packages/ziwei-engine/src since the 2026-11-08 monorepo move, and in lib/ziwei
// before it. Detect the layout per checkout so --root can still compare against an older base.
const engineDir = existsSync(path.join(root, 'packages/ziwei-engine/src/algorithm.ts'))
  ? 'packages/ziwei-engine/src'
  : 'lib/ziwei';
const load = (rel: string) => import(pathToFileURL(path.join(root, rel.replace(/^lib\/ziwei\//, `${engineDir}/`))).href);

type Chart = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function starStr(s: { name: string; brightnessRaw?: string; siHua?: string }) {
  return `${s.name}${s.brightnessRaw ? `(${s.brightnessRaw})` : ''}${s.siHua ? `[化${s.siHua}]` : ''}`;
}

/** Stable, date-independent palace line (no currentAge / isCurrentDaXian). */
function palaceLine(p: Chart) {
  const flags = [p.isMingGong && '命', p.isShenGong && '身'].filter(Boolean).join('');
  const self = (p.selfSihua ?? []).map((x: Chart) => `${x.starName}自化${x.siHua}`).join(',');
  const age = p.daXianAge ? ` ${p.daXianAge[0]}-${p.daXianAge[1]}` : '';
  return `${ST[p.stem]}${BR[p.branch]} ${p.name}${flags ? `<${flags}>` : ''}${age}: ${p.stars.map(starStr).join(' ')}${self ? ` {${self}}` : ''}`;
}

function header(c: Chart) {
  const b = c.birthInfo, l = c.lunarInfo;
  return `${b.year}-${b.month}-${b.day} ${BR[b.hour]}时(${b.hour}) ${b.gender} | 农历${l.lunarYear}-${l.isLeapMonth ? '闰' : ''}${Math.abs(l.lunarMonth)}-${l.lunarDay} ${ST[l.yearStem]}${BR[l.yearBranch]}年 | ${c.wuxingJuName} 命${BR[c.mingGongBranch]} 身${BR[c.shenGongBranch]} 命主${c.mingZhu ?? ''} 身主${c.shenZhu ?? ''} ${c.yinYangGender ?? ''}`;
}

async function main() {
  const { generateChart, setBrightnessSchool } = await load('lib/ziwei/algorithm.ts');
  const school = opt('school');
  if (school) setBrightnessSchool(school);
  const leapMonth = opt('leap');
  const gen = (info: Chart) => generateChart(info, leapMonth ? { leapMonth } : undefined);

  const { detectPatterns } = await load('lib/ziwei/patterns.ts');
  const patternNames = (c: Chart) => detectPatterns(c).map((p: Chart) => p.name).join('、');

  if (flag('sweep')) {
    // Same spread as pan-integrity, plus month-boundary / leap-month / late-子时-sensitive dates.
    const extra: [number, number, number][] = [
      [1984, 2, 4], [1999, 2, 11], [2001, 5, 23], [2004, 3, 21], [2006, 8, 24], [2020, 5, 23], [2023, 3, 22], [2023, 4, 19],
    ];
    const dates: [number, number, number][] = [];
    for (let y = 1960; y <= 2010; y += 7) for (let m = 1; m <= 12; m += 3) for (let d = 5; d <= 26; d += 10) dates.push([y, m, d]);
    dates.push(...extra);
    for (const [y, m, d] of dates)
      for (let h = 0; h < 12; h += 3)
        for (const g of ['male', 'female'] as const) {
          const key = `${y}-${m}-${d} h${h} ${g}`;
          try {
            const c = gen({ year: y, month: m, day: d, hour: h, gender: g });
            const palaces = [...c.palaces].sort((a: Chart, b: Chart) => a.branch - b.branch).map(palaceLine).join(' | ');
            const dx = c.daXians.map((x: Chart) => `${x.startAge}-${x.endAge}${BR[x.palaceBranch]}${x.siHua ? `:${x.siHua.lu}${x.siHua.quan}${x.siHua.ke}${x.siHua.ji}` : ''}`).join(',');
            console.log(`${key} || ${header(c)} || ${palaces} || 大限 ${dx} || 格局 ${patternNames(c)}`);
          } catch (e) {
            console.log(`${key} || ERROR ${(e as Error).message}`);
          }
        }
    return;
  }

  const date = opt('date');
  const gender = opt('gender');
  if (!date || (gender !== 'male' && gender !== 'female') || (!opt('time') && opt('hour') === undefined)) {
    console.error('usage: --date YYYY-MM-DD (--time HH:MM [--lng E] | --hour 0-11) --gender male|female [--leap P] [--school S] [--json]');
    process.exit(1);
  }
  const [y, m, d] = date.split('-');
  let info: Chart;
  if (opt('time')) {
    const { formToBirthInfo } = await load('lib/ziwei/share.ts');
    const [hh, mm] = opt('time')!.split(':');
    const lng = opt('lng');
    info = formToBirthInfo({
      name: '', year: y, month: m, day: d, clockHour: hh, clockMinute: mm ?? '0', unknownTime: false,
      province: lng ? 'cli' : '', city: '', longitude: lng ? Number(lng) : 120, gender,
    });
  } else {
    info = { year: +y, month: +m, day: +d, hour: Number(opt('hour')), gender };
  }

  const c = gen(info);
  if (flag('json')) { console.log(JSON.stringify(c, null, 2)); return; }

  console.log(header(c));
  if (opt('time')) console.log(`input ${date} ${opt('time')}${opt('lng') ? ` @${opt('lng')}°E` : ' (no longitude: no true-solar correction)'} → charting day ${info.year}-${info.month}-${info.day}, branch ${BR[info.hour]}(${info.hour})`);
  if (c.lunarInfo.fourPillars) console.log(`四柱 ${c.lunarInfo.fourPillars.join(' ')}`);
  console.log('');
  for (const p of [...c.palaces].sort((a: Chart, b: Chart) => a.branch - b.branch)) console.log(palaceLine(p));
  console.log('');
  console.log('大限 ' + c.daXians.map((x: Chart) => `${x.startAge}-${x.endAge} ${BR[x.palaceBranch]}${x.palaceName}`).join(' / '));
  const pats = patternNames(c);
  if (pats) console.log('格局 ' + pats);
}

main().catch((e) => { console.error(e); process.exit(1); });
