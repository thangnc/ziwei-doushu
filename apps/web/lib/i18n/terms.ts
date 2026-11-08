/**
 * Chart-term presenter: engine identifier → display term for the current locale. Pure; browser- and server-safe.
 *
 * The engine keeps its Chinese identifiers (`Star.name`, `Palace.name`, `siHua`, …). Components keep using them
 * for logic and lookups, and call this module only for the text they show. Chinese output is the identifier
 * itself, so the Chinese UI is unchanged. Terms and the display rule: `terms-data.ts` and
 * docs/decisions/localization.md D-9.
 */
import { BRANCHES, STEMS } from '@ziwei/engine/constants';
import type { ZiweiChart } from '@ziwei/engine/types';
import type { Locale } from './locales';
import { DECIDED_TERMS, TERMS, type TermCategory, type TermStatus } from './terms-data';

export type { TermCategory, TermStatus } from './terms-data';

export interface DisplayTerm {
  /** What to show. */
  text: string;
  /** The engine identifier it came from. */
  zh: string;
  /** Audit status; 'missing' when the identifier has no entry (the coverage test keeps engine output covered). */
  status: TermStatus | 'missing';
  /**
   * True when the Vietnamese text is not a settled term: a Disputed or Unverified Hán-Việt reading, or a missing
   * entry shown as the raw identifier. Always false in Chinese. The UI marks provisional terms (D-9).
   */
  provisional: boolean;
}

/** Display term for one identifier. Unknown identifiers fall back to the identifier itself, marked provisional. */
export function presentTerm(locale: Locale, category: TermCategory, zh: string): DisplayTerm {
  const entry = TERMS[category][zh];
  const status = entry ? entry[1] : 'missing';
  if (locale === 'zh') return { text: zh, zh, status, provisional: false };
  if (!entry) return { text: zh, zh, status, provisional: true };
  const decided = `${category}:${zh}` in DECIDED_TERMS;
  return { text: entry[0], zh, status, provisional: !decided && status !== 'verified' };
}

/** Shorthand when only the text is needed. */
export function termText(locale: Locale, category: TermCategory, zh: string): string {
  return presentTerm(locale, category, zh).text;
}

/** Heavenly stem by index (0 = 甲). */
export function presentStem(locale: Locale, stemIndex: number): DisplayTerm {
  return presentTerm(locale, 'stem', STEMS[stemIndex]);
}

/** Earthly branch by index (0 = 子). */
export function presentBranch(locale: Locale, branchIndex: number): DisplayTerm {
  return presentTerm(locale, 'branch', BRANCHES[branchIndex]);
}

/** 干支 of a palace or year: 「甲子」 in Chinese, "Giáp Tý" in Vietnamese. */
export function ganzhiText(locale: Locale, stemIndex: number, branchIndex: number): string {
  const stem = presentStem(locale, stemIndex).text;
  const branch = presentBranch(locale, branchIndex).text;
  return locale === 'zh' ? `${stem}${branch}` : `${stem} ${branch}`;
}

/** 四化 compound 「化禄」 from the bare value 「禄」 stored on `Star.siHua`. */
export function presentSiHuaCompound(locale: Locale, siHua: string): DisplayTerm {
  return presentTerm(locale, 'sihuaCompound', `化${siHua}`);
}

/** Major-star placeholder used by the pattern-name templates in the audit (§4.18). */
const TEMPLATE_STAR = { zh: '{主星}', vi: '{chính tinh}' } as const;

/**
 * 格局 name from `detectPatterns`. Fixed names come from the `pattern` table; names built from a template
 * (e.g. 「太阳化禄入命」 = {主星}化禄入命) combine the template with the star's own term. The result is
 * provisional when either part is.
 */
export function presentPatternName(locale: Locale, name: string): DisplayTerm {
  if (TERMS.pattern[name]) return presentTerm(locale, 'pattern', name);
  for (const template of Object.keys(TERMS.patternTemplate)) {
    const suffix = template.slice(TEMPLATE_STAR.zh.length);
    if (!template.startsWith(TEMPLATE_STAR.zh) || !name.endsWith(suffix)) continue;
    const starZh = name.slice(0, name.length - suffix.length);
    if (!TERMS.star[starZh]) continue;
    const tpl = presentTerm(locale, 'patternTemplate', template);
    const star = presentTerm(locale, 'star', starZh);
    if (locale === 'zh') return { text: name, zh: name, status: tpl.status, provisional: false };
    return {
      text: tpl.text.replace(TEMPLATE_STAR.vi, star.text),
      zh: name,
      status: tpl.status,
      provisional: tpl.provisional || star.provisional,
    };
  }
  return presentTerm(locale, 'pattern', name);
}

// ── Whole-chart display model ─────────────────────────────────────────────────

export interface PresentedStar {
  /** Engine identifier (`Star.name`), for keys and lookups. */
  id: string;
  type: 'major' | 'minor' | 'lucky' | 'sha';
  name: DisplayTerm;
  siHua?: DisplayTerm;
  brightness?: DisplayTerm;
}

export interface PresentedPalace {
  branch: number;
  name: DisplayTerm;
  ganzhi: string;
  stars: PresentedStar[];
}

export interface PresentedChart {
  palaces: PresentedPalace[];
  mingGongBranch: DisplayTerm;
  shenGongBranch: DisplayTerm;
  wuxingJu: DisplayTerm;
  yinYangGender?: DisplayTerm;
  mingZhu?: DisplayTerm;
  shenZhu?: DisplayTerm;
  daXians: { startAge: number; endAge: number; palaceName: DisplayTerm }[];
}

/** Every chart term the board can show, in the given locale. Engine data is read, never changed. */
export function presentChart(chart: ZiweiChart, locale: Locale): PresentedChart {
  const star = (zh: string | undefined) => (zh ? presentTerm(locale, 'star', zh) : undefined);
  return {
    palaces: chart.palaces.map((p) => ({
      branch: p.branch,
      name: presentTerm(locale, 'palace', p.name),
      ganzhi: ganzhiText(locale, p.stem, p.branch),
      stars: p.stars.map((s) => ({
        id: s.name,
        type: s.type,
        name: presentTerm(locale, 'star', s.name),
        siHua: s.siHua ? presentTerm(locale, 'sihua', s.siHua) : undefined,
        brightness: s.brightnessRaw ? presentTerm(locale, 'brightness', s.brightnessRaw) : undefined,
      })),
    })),
    mingGongBranch: presentBranch(locale, chart.mingGongBranch),
    shenGongBranch: presentBranch(locale, chart.shenGongBranch),
    wuxingJu: presentTerm(locale, 'wuxingJu', chart.wuxingJuName),
    yinYangGender: chart.yinYangGender ? presentTerm(locale, 'yinYangGender', chart.yinYangGender) : undefined,
    mingZhu: star(chart.mingZhu),
    shenZhu: star(chart.shenZhu),
    daXians: chart.daXians.map((d) => ({
      startAge: d.startAge,
      endAge: d.endAge,
      palaceName: presentTerm(locale, 'palace', d.palaceName),
    })),
  };
}
