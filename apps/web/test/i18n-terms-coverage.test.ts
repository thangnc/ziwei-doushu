/**
 * Every chart term the engine can emit has a Vietnamese display term, and that term is the one the
 * terminology audit gives under the D-9 display rule (Phase 2 of the Vietnamese localization).
 *
 * Sources of the expected values:
 *  - docs/audits/terminology-audit.md §4 (rows, statuses, Hán-Việt and conventional columns), read at test time
 *    by test/support/terminology-audit.ts, so lib/i18n/terms-data.ts can't drift from the audit;
 *  - docs/decisions/localization.md D-9 (display rule: Verified → conventional term, Disputed/Unverified →
 *    Hán-Việt reading marked provisional) and D-1 (identifiers unchanged);
 *  - the engine's own constant tables and generateChart / detectPatterns output on synthetic inputs, used only
 *    to enumerate which identifiers exist, never as expected display values.
 *  - the Chinese presentation must be the identifier itself (the Chinese UI may not change).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as nodeModule from 'node:module';
import { fileURLToPath } from 'node:url';
import { generateChart, setBrightnessSchool } from '@ziwei/engine/algorithm';
import { BRANCHES, SHICHEN, SI_HUA_TABLE, STEMS } from '@ziwei/engine/constants';
import { BOSHI_SHEN, JIANG_QIAN_SHEN, SUI_QIAN_SHEN } from '@ziwei/engine/shier-shen';
import { DECIDED_TERMS, TERMS, type TermCategory } from '../lib/i18n/terms-data';
import { presentChart, presentPatternName, presentTerm } from '../lib/i18n/terms';
import { COVERED_REACHABILITY, displayFromCell, expectedDisplay, readAuditRows } from './support/terminology-audit';

// patterns.ts imports `server-only`, which only exists in a Next build: resolve it to an empty module, then
// load patterns.ts with require (this workspace runs tests as CommonJS, so top-level await is unavailable).
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

const { detectPatterns, getMingGongSummary } =
  require('@ziwei/engine/patterns') as typeof import('@ziwei/engine/patterns');

const CJK = /[㐀-鿿豈-﫿]/;
let checked = 0;

// ── 1. The display rule, on cells quoted from the audit ──
assert.equal(displayFromCell('Mệnh (Mệnh Viên)'), 'Mệnh');
assert.equal(displayFromCell('Lực Sĩ / Lực Sỹ'), 'Lực Sĩ');
assert.equal(displayFromCell('Thai Phụ / Đài Phụ (台 = thai, đài)'), 'Thai Phụ');
assert.equal(displayFromCell('Thiên Mã Tại Thiên (Di)'), 'Thiên Mã Tại Thiên Di');
assert.equal(displayFromCell('Triệt (Triệt Lộ không vong)'), 'Triệt');

// ── 2. terms-data.ts matches the audit, row for row ──
const auditRows = readAuditRows().filter((r) => (COVERED_REACHABILITY as readonly string[]).includes(r.reachability));
assert.ok(auditRows.length > 200, `expected the audit's covered rows, got ${auditRows.length}`);
const decisions = readFileSync(
  fileURLToPath(new URL('../../../docs/decisions/localization.md', import.meta.url)),
  'utf8',
);
const auditKeys = new Set<string>();
for (const row of auditRows) {
  const key = `${row.category}:${row.zh}`;
  assert.ok(!auditKeys.has(key), `audit has two covered rows for ${key}`);
  auditKeys.add(key);
  const entry = TERMS[row.category][row.zh];
  assert.ok(entry, `terms-data.ts has no entry for ${key} (audit §${row.section})`);
  assert.equal(entry[1], row.status, `${key}: status must match the audit`);
  const decision = DECIDED_TERMS[key];
  if (decision) {
    assert.ok(new RegExp(`^### ${decision} `, 'm').test(decisions), `${key}: decision ${decision} not in localization.md`);
  } else {
    assert.equal(entry[0], expectedDisplay(row), `${key}: display term must follow the D-9 rule`);
  }
  checked++;
}
for (const [category, entries] of Object.entries(TERMS)) {
  for (const zh of Object.keys(entries)) {
    assert.ok(auditKeys.has(`${category}:${zh}`), `terms-data.ts entry ${category}:${zh} is not a covered audit row`);
    const [vi] = entries[zh];
    assert.ok(vi.length > 0 && !CJK.test(vi), `${category}:${zh}: Vietnamese term must be non-empty, without CJK`);
  }
}
for (const key of Object.keys(DECIDED_TERMS)) assert.ok(auditKeys.has(key), `DECIDED_TERMS has unknown key ${key}`);

// ── 3. Every identifier in the engine's own tables is covered ──
function covered(category: TermCategory, zh: string, where: string) {
  assert.ok(TERMS[category][zh], `${where}: no ${category} term for 「${zh}」`);
  checked++;
}
STEMS.forEach((s) => covered('stem', s, 'constants.STEMS'));
BRANCHES.forEach((b) => covered('branch', b, 'constants.BRANCHES'));
SHICHEN.forEach((s) => covered('shichen', s.name, 'constants.SHICHEN'));
Object.values(SI_HUA_TABLE).flat().forEach((s) => covered('star', s, 'constants.SI_HUA_TABLE'));
BOSHI_SHEN.forEach((s) => covered('boshi', s, 'shier-shen.BOSHI_SHEN'));
SUI_QIAN_SHEN.forEach((s) => covered('suiqian', s, 'shier-shen.SUI_QIAN_SHEN'));
JIANG_QIAN_SHEN.forEach((s) => covered('jiangqian', s, 'shier-shen.JIANG_QIAN_SHEN'));
(['禄', '权', '科', '忌'] as const).forEach((h) => {
  covered('sihua', h, 'Star.siHua');
  covered('sihuaCompound', `化${h}`, '化 + Star.siHua');
});

// ── 4. Every identifier in real engine output is covered, in all four brightness schools ──
// Synthetic inputs: years 1960–2010 step 10, months 1/7, day 15, 时辰 0/6, both genders, per school.
const SCHOOLS = ['QS', 'XD1', 'ZZ', 'XD2'] as const;
const seenPatterns = new Set<string>();
let charts = 0;
try {
  for (const school of SCHOOLS) {
    setBrightnessSchool(school);
    for (let year = 1960; year <= 2010; year += 10) {
      for (const month of [1, 7]) {
        for (const hour of [0, 6]) {
          for (const gender of ['male', 'female'] as const) {
            const chart = generateChart({ year, month, day: 15, hour, gender });
            charts++;
            const where = `${year}-${month}-15 h${hour} ${gender} ${school}`;
            for (const p of chart.palaces) {
              covered('palace', p.name, where);
              for (const s of p.stars) {
                covered('star', s.name, where);
                if (s.siHua) covered('sihua', s.siHua, where);
                if (s.brightnessRaw) covered('brightness', s.brightnessRaw, where);
              }
            }
            chart.daXians.forEach((d) => covered('palace', d.palaceName, where));
            covered('wuxingJu', chart.wuxingJuName, where);
            if (chart.yinYangGender) covered('yinYangGender', chart.yinYangGender, where);
            if (chart.mingZhu) covered('star', chart.mingZhu, where);
            if (chart.shenZhu) covered('star', chart.shenZhu, where);
            if (school === 'QS') {
              covered('mingGongNature', getMingGongSummary(chart).nature, where);
              for (const pattern of detectPatterns(chart)) {
                seenPatterns.add(pattern.name);
                const shown = presentPatternName('vi', pattern.name);
                assert.notEqual(shown.status, 'missing', `${where}: no term for 格局 「${pattern.name}」`);
                assert.ok(!CJK.test(shown.text), `${where}: 格局 「${pattern.name}」 shown as ${shown.text}`);
                checked++;
              }
            }

            // ── 5. Presentation: Chinese is the identifier itself; Vietnamese has no CJK left ──
            const zhView = presentChart(chart, 'zh');
            const viView = presentChart(chart, 'vi');
            chart.palaces.forEach((p, i) => {
              assert.equal(zhView.palaces[i].name.text, p.name);
              p.stars.forEach((s, j) => {
                assert.equal(zhView.palaces[i].stars[j].name.text, s.name);
                assert.equal(zhView.palaces[i].stars[j].name.provisional, false);
              });
              const viPalace = viView.palaces[i];
              const texts = [viPalace.name.text, viPalace.ganzhi, ...viPalace.stars.flatMap((s) => [
                s.name.text, s.siHua?.text ?? '', s.brightness?.text ?? '',
              ])];
              for (const t of texts) assert.ok(!CJK.test(t), `${where}: Vietnamese chart still shows 「${t}」`);
              // Two different stars in one palace must not read the same in Vietnamese.
              const names = viPalace.stars.map((s) => s.name.text);
              assert.equal(new Set(names).size, names.length, `${where}: duplicate star names in ${p.name}: ${names}`);
            });
            assert.equal(zhView.wuxingJu.text, chart.wuxingJuName);
          }
        }
      }
    }
  }
} finally {
  setBrightnessSchool('default');
}

// ── 6. Presenter behaviour on statuses (values from the audit rows named) ──
assert.deepEqual(presentTerm('vi', 'star', '紫微'), { text: 'Tử Vi', zh: '紫微', status: 'verified', provisional: false });
assert.deepEqual(presentTerm('vi', 'star', '咸池'), { text: 'Hàm Trì', zh: '咸池', status: 'disputed', provisional: true });
assert.deepEqual(presentTerm('vi', 'star', '天巫'), { text: 'Thiên Vu', zh: '天巫', status: 'unverified', provisional: true });
assert.deepEqual(presentTerm('vi', 'palace', '子女'), { text: 'Tử Tức', zh: '子女', status: 'verified', provisional: false });
assert.deepEqual(presentTerm('vi', 'star', '不存在'), { text: '不存在', zh: '不存在', status: 'missing', provisional: true });
assert.deepEqual(presentTerm('zh', 'star', '咸池'), { text: '咸池', zh: '咸池', status: 'disputed', provisional: false });
// Template: audit §4.18 「{主星}化禄入命」 → "{chính tinh} Hóa Lộc Nhập Mệnh", star 太阳 → Thái Dương (§4.1).
assert.deepEqual(presentPatternName('vi', '太阳化禄入命'), {
  text: 'Thái Dương Hóa Lộc Nhập Mệnh', zh: '太阳化禄入命', status: 'unverified', provisional: true,
});
assert.equal(presentPatternName('zh', '太阳化禄入命').text, '太阳化禄入命');

console.log(
  `i18n-terms-coverage regression passed (${auditRows.length} audit rows, ${charts} charts, ` +
    `${seenPatterns.size} distinct 格局, ${checked} checks)`,
);
