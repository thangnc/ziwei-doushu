/**
 * Reads the identifier tables (§4) of docs/audits/terminology-audit.md and derives the Vietnamese display
 * term of each row with the rule recorded in docs/decisions/localization.md D-9.
 *
 * Used by test/i18n-terms-coverage.test.ts to check that lib/i18n/terms-data.ts matches the audit.
 * Not a test itself (no `.test.ts` suffix), so it is not registered in package.json.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { TermCategory, TermStatus } from '../../lib/i18n/terms-data';

export const AUDIT_PATH = fileURLToPath(new URL('../../../../docs/audits/terminology-audit.md', import.meta.url));

/** Audit section (§4.x) → presenter category. Sections not listed here are never emitted by the engine. */
export const SECTION_CATEGORY: Record<string, TermCategory> = {
  '4.1': 'star',
  '4.4': 'palace',
  '4.5': 'brightness',
  '4.6': 'sihua',
  '4.7': 'sihuaCompound',
  '4.8': 'stem',
  '4.9': 'branch',
  '4.10': 'shichen',
  '4.11': 'wuxingJu',
  '4.12': 'yinYangGender',
  '4.13': 'boshi',
  '4.14': 'suiqian',
  '4.15': 'jiangqian',
  '4.16': 'yunxianLabel',
  '4.17': 'pattern',
  '4.18': 'patternTemplate',
  '4.19': 'mingGongNature',
};

/** Reachability classes whose rows the presenter must cover (D-9): what the engine or the UI can emit. */
export const COVERED_REACHABILITY = ['runtime-observed', 'declared-but-not-observed'] as const;

export interface AuditRow {
  section: string;
  category: TermCategory;
  zh: string;
  hanViet: string;
  conventional: string;
  status: TermStatus;
  reachability: string;
}

export function readAuditRows(markdown = readFileSync(AUDIT_PATH, 'utf8')): AuditRow[] {
  const rows: AuditRow[] = [];
  let section: string | null = null;
  for (const line of markdown.split('\n')) {
    const heading = /^### (4\.\d+) /.exec(line);
    if (heading) { section = heading[1]; continue; }
    if (/^## /.test(line)) { section = null; continue; }
    if (!section || !line.startsWith('| ') || line.startsWith('| Chinese identifier')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length !== 8) continue;
    const category = SECTION_CATEGORY[section];
    if (!category) continue;
    const [zh, , hanViet, conventional, , statusCell, , reachabilityCell] = cells;
    const status = /\*\*(Verified|Disputed|Unverified)\*\*/.exec(statusCell)?.[1];
    if (!status) throw new Error(`terminology audit §${section}: no status in row "${zh}"`);
    rows.push({
      section,
      category,
      zh,
      hanViet,
      conventional,
      status: status.toLowerCase() as TermStatus,
      reachability: reachabilityCell.replace(/\s*\(.*$/, ''),
    });
  }
  return rows;
}

/**
 * D-9 display rule for one audit cell:
 *  1. a one-word parenthetical that completes the name is unwrapped: "Thiên Mã Tại Thiên (Di)" → "… Thiên Di";
 *  2. every other parenthetical (notes, alternative long forms, HV glosses) is dropped;
 *  3. of several variants "A / B", the first is used.
 */
export function displayFromCell(cell: string): string {
  return cell
    .replace(/\s*\(([A-ZĐ][^\s()=;,]*)\)/g, ' $1')
    .replace(/\s*\([^)]*\)/g, '')
    .split(' / ')[0]
    .trim();
}

/** D-9: Verified rows show the conventional Vietnamese term; Disputed and Unverified rows show the Hán-Việt reading. */
export function expectedDisplay(row: AuditRow): string {
  return displayFromCell(row.status === 'verified' ? row.conventional : row.hanViet);
}
