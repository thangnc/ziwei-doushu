/**
 * Change detector for the Vietnamese chart presentation (Phase 2 of the Vietnamese localization).
 *
 * Like the engine baselines (packages/ziwei-engine/test/fixtures/README.md), this pins current output; it detects
 * change and proves nothing about correctness. Correctness of each term is checked against the terminology
 * audit by i18n-terms-coverage.test.ts. This test makes any change to what a Vietnamese reader sees on the
 * board (a term, a provisional mark, a 干支 spelling) show up as a reviewable fixture diff.
 *
 * Fixture: test/fixtures/vi-presentation-baseline.vi.txt, written only by
 * test/fixtures/generate-vi-presentation-baseline.ts --write (never by this test).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIXTURE_FILE, renderBody } from './fixtures/vi-presentation-lib';

const expected = readFileSync(FIXTURE_FILE, 'utf8').split('\n');
const actual = renderBody().split('\n');

const diffs: string[] = [];
for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
  if (expected[i] !== actual[i]) {
    diffs.push(`line ${i + 1}\n  fixture: ${expected[i] ?? '(missing)'}\n  now:     ${actual[i] ?? '(missing)'}`);
  }
}
assert.equal(
  diffs.length,
  0,
  `Vietnamese presentation changed in ${diffs.length} chart(s). If the change is intended (a recorded term ` +
    `decision), regenerate with generate-vi-presentation-baseline.ts --write and review the diff.\n` +
    diffs.slice(0, 5).join('\n'),
);

console.log(`vi-presentation-baseline regression passed (${actual.length - 1} charts)`);
