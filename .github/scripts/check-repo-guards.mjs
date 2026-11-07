#!/usr/bin/env node
// Repository guards that CI runs before installing anything.
//
// 1. Every regression test is registered. There is no test framework: `npm test` runs only the
//    files chained in package.json `scripts.test`, so a new scripts/regression/*.test.ts that
//    nobody appended there never runs and CI stays green. This fails on an unregistered file,
//    a registered file that doesn't exist, a duplicate entry, or an entry in an unexpected form.
// 2. One Node version everywhere. The baseline fixtures are only valid in the canonical runtime
//    (scripts/regression/fixtures/README.md), so `.nvmrc`, package.json `engines.node` and the
//    `node:<version>` tag of every workflow `container: image:` must name the same version.
//
// Node standard library only; run from the repository root: node .github/scripts/check-repo-guards.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const errors = [];
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

// --- 1. Regression test registration ---------------------------------------------------------

const TEST_DIR = 'scripts/regression';
const ENTRY = /^tsx (scripts\/regression\/[A-Za-z0-9._-]+\.test\.ts)$/;

const onDisk = readdirSync(TEST_DIR)
  .filter((name) => name.endsWith('.test.ts'))
  .map((name) => `${TEST_DIR}/${name}`)
  .sort();

const testScript = pkg.scripts?.test ?? '';
const registered = [];
for (const raw of testScript.split('&&')) {
  const entry = raw.trim();
  const match = ENTRY.exec(entry);
  if (!match) {
    errors.push(`package.json scripts.test has an entry in an unexpected form: "${entry}" (expected "tsx ${TEST_DIR}/<name>.test.ts")`);
    continue;
  }
  registered.push(match[1]);
}

const seen = new Set();
for (const file of registered) {
  if (seen.has(file)) errors.push(`${file} is registered more than once in package.json scripts.test`);
  seen.add(file);
  if (!onDisk.includes(file)) errors.push(`${file} is registered in package.json scripts.test but does not exist`);
}
for (const file of onDisk) {
  if (!seen.has(file)) {
    errors.push(`${file} is not registered: append " && tsx ${file}" to package.json scripts.test, or it never runs`);
  }
}

console.log(`Regression tests: ${onDisk.length} on disk, ${registered.length} registered.`);

// --- 2. Node version consistency -------------------------------------------------------------

const versions = [];
versions.push({ where: '.nvmrc', version: readFileSync('.nvmrc', 'utf8').trim() });
versions.push({ where: 'package.json engines.node', version: String(pkg.engines?.node ?? '(missing)') });

const WORKFLOW_DIR = '.github/workflows';
const IMAGE = /^\s*image:\s*['"]?node:([0-9][^-@\s'"]*)/;
for (const name of readdirSync(WORKFLOW_DIR).filter((n) => /\.ya?ml$/.test(n)).sort()) {
  const lines = readFileSync(join(WORKFLOW_DIR, name), 'utf8').split('\n');
  lines.forEach((line, i) => {
    const match = IMAGE.exec(line);
    if (match) versions.push({ where: `${WORKFLOW_DIR}/${name}:${i + 1}`, version: match[1] });
  });
}

const expected = versions[0].version;
for (const { where, version } of versions) {
  console.log(`Node version ${version.padEnd(10)} ${where}`);
  if (version !== expected) errors.push(`${where} names Node ${version}, but .nvmrc names ${expected}`);
}
if (versions.length < 3) errors.push(`no "image: node:<version>" container found under ${WORKFLOW_DIR}`);

// --- Result ----------------------------------------------------------------------------------

if (errors.length > 0) {
  console.error(`\n${errors.length} repository guard failure(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log('\nRepository guards passed');
