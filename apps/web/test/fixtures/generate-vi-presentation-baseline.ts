/**
 * Generates vi-presentation-baseline.vi.txt. Without --write it only prints a summary; tests and hooks never write
 * fixtures. Regenerate only when a display term changes on purpose (a decision in docs/decisions/localization.md),
 * and review the diff: every changed line must be explained by that decision.
 *
 *   npx tsx apps/web/test/fixtures/generate-vi-presentation-baseline.ts --write
 *
 * The body depends only on engine output (pinned by packages/ziwei-engine/test/fixtures) and lib/i18n/terms*.ts,
 * so unlike the engine baselines it needs no canonical container.
 */
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { FIXTURE_FILE, renderBody } from './vi-presentation-lib';

const body = renderBody();
const sha = createHash('sha256').update(body).digest('hex');
const lines = body.trimEnd().split('\n').length;
if (process.argv.includes('--write')) {
  writeFileSync(FIXTURE_FILE, body);
  console.log(`wrote ${FIXTURE_FILE.pathname} (${lines} charts, ${body.length} chars, sha256 ${sha})`);
} else {
  console.log(`dry run: ${lines} charts, ${body.length} chars, sha256 ${sha}. Pass --write to write the fixture.`);
}
