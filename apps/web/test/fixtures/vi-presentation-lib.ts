/**
 * Shared by generate-vi-presentation-baseline.ts (writes the fixture) and vi-presentation-baseline.test.ts
 * (compares against it). Renders the Vietnamese chart presentation (`presentChart(chart, 'vi')`) of a fixed set of
 * synthetic charts as plain text, one line per chart.
 *
 * Line format: `<input key>\t<chart fields> || <palace> | <palace> …`, palaces in `chart.palaces` order.
 * A palace is `<name>@<干支>: <star>, <star> …`; a star is `<name>[<brightness>/<四化>]`. A trailing `?` marks
 * a provisional term (Disputed or Unverified Hán-Việt reading, docs/decisions/localization.md D-9).
 */
import { generateChart } from '@ziwei/engine/algorithm';
import { presentChart, type DisplayTerm } from '../../lib/i18n/terms';

export const FIXTURE_FILE = new URL('./vi-presentation-baseline.vi.txt', import.meta.url);

export interface Case {
  key: string;
  input: { year: number; month: number; day: number; hour: number; gender: 'male' | 'female' };
}

/** Synthetic inputs: 1960–2010 step 10 × months 1/4/7/10 × day 15 × 时辰 0/6 × both genders = 96 charts. */
export function cases(): Case[] {
  const out: Case[] = [];
  for (let year = 1960; year <= 2010; year += 10) {
    for (const month of [1, 4, 7, 10]) {
      for (const hour of [0, 6]) {
        for (const gender of ['male', 'female'] as const) {
          const mm = String(month).padStart(2, '0');
          out.push({ key: `${year}-${mm}-15 h${hour} ${gender}`, input: { year, month, day: 15, hour, gender } });
        }
      }
    }
  }
  return out;
}

const t = (term: DisplayTerm | undefined) => (term ? `${term.text}${term.provisional ? '?' : ''}` : '-');

export function renderCase(c: Case): string {
  const view = presentChart(generateChart(c.input), 'vi');
  const head = [
    `Mệnh=${t(view.mingGongBranch)}`,
    `Thân=${t(view.shenGongBranch)}`,
    t(view.wuxingJu),
    t(view.yinYangGender),
    `chủ=${t(view.mingZhu)}/${t(view.shenZhu)}`,
    `hạn=${view.daXians.map((d) => `${d.startAge}-${d.endAge}:${t(d.palaceName)}`).join(',')}`,
  ].join(' ');
  const palaces = view.palaces.map((p) => {
    const stars = p.stars.map((s) => {
      const tags = [s.brightness ? t(s.brightness) : '', s.siHua ? t(s.siHua) : ''].filter(Boolean).join('/');
      return `${t(s.name)}${tags ? `[${tags}]` : ''}`;
    });
    return `${t(p.name)}@${p.ganzhi}: ${stars.join(', ')}`;
  });
  return `${c.key}\t${head} || ${palaces.join(' | ')}`;
}

export function renderBody(): string {
  return cases().map(renderCase).join('\n') + '\n';
}
