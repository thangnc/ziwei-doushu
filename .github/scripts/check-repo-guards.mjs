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
// 3. Knowledge-base format. Every docs/solutions/<category>/*.md follows the schema in
//    docs/solutions/README.md: a known category directory, the required frontmatter keys with
//    valid values, and the required sections. Claude greps this frontmatter to find prior fixes,
//    so a drifted file is a lesson nobody finds.
//
// Node standard library only; run from the repository root: node .github/scripts/check-repo-guards.mjs

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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

// --- 3. Knowledge-base format ----------------------------------------------------------------

// Keep these lists in sync with docs/solutions/README.md.
const SOLUTIONS_DIR = 'docs/solutions';
const CATEGORIES = ['engine', 'time', 'baselines', 'ci', 'workflow', 'docs'];
const PROBLEM_TYPES = ['bug', 'convention', 'tooling', 'workflow', 'docs'];
const SEVERITIES = ['low', 'medium', 'high'];
const REQUIRED_KEYS = ['title', 'date', 'category', 'module', 'problem_type', 'severity', 'tags'];
const REQUIRED_SECTIONS = ['## Problem', '## Root cause', '## Solution', '## Prevention'];

// Minimal frontmatter reader: `key: value` lines between the first two `---` lines. Values may be
// quoted strings or `[a, b]` lists; `#` comments are not supported, because values such as
// "PR #4" contain `#`. No YAML dependency, on purpose (see the header).
function readFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end < 0) return null;
  const data = {};
  for (const line of lines.slice(1, end)) {
    const match = /^([A-Za-z_]+):\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    let value = match[2];
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((v) => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    data[match[1]] = value;
  }
  return { data, body: lines.slice(end + 1).join('\n') };
}

let solutionCount = 0;
if (existsSync(SOLUTIONS_DIR)) {
  for (const entry of readdirSync(SOLUTIONS_DIR).sort()) {
    const path = `${SOLUTIONS_DIR}/${entry}`;
    if (!statSync(path).isDirectory()) {
      if (entry !== 'README.md') errors.push(`${path} is outside a category directory: move it to ${SOLUTIONS_DIR}/<category>/`);
      continue;
    }
    if (!CATEGORIES.includes(entry)) {
      errors.push(`${path}/ is not a known category (${CATEGORIES.join(', ')}); add it to docs/solutions/README.md and this script first`);
      continue;
    }
    for (const name of readdirSync(path).sort()) {
      const file = `${path}/${name}`;
      if (!name.endsWith('.md')) {
        errors.push(`${file} is not a Markdown file`);
        continue;
      }
      solutionCount += 1;
      const parsed = readFrontmatter(readFileSync(file, 'utf8'));
      if (!parsed) {
        errors.push(`${file} has no frontmatter block (--- … ---) at the top`);
        continue;
      }
      const { data, body } = parsed;
      for (const key of REQUIRED_KEYS) {
        const value = data[key];
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          errors.push(`${file} is missing frontmatter "${key}"`);
        }
      }
      if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) errors.push(`${file} has date "${data.date}"; expected YYYY-MM-DD`);
      if (data.category && data.category !== entry) errors.push(`${file} has category "${data.category}" but sits in ${path}/`);
      if (data.problem_type && !PROBLEM_TYPES.includes(data.problem_type)) {
        errors.push(`${file} has problem_type "${data.problem_type}"; expected one of ${PROBLEM_TYPES.join(', ')}`);
      }
      if (data.severity && !SEVERITIES.includes(data.severity)) {
        errors.push(`${file} has severity "${data.severity}"; expected one of ${SEVERITIES.join(', ')}`);
      }
      if (data.tags !== undefined && !Array.isArray(data.tags)) errors.push(`${file} has tags that are not a [list]`);
      const headings = body.split('\n').map((l) => l.trim());
      for (const section of REQUIRED_SECTIONS) {
        if (!headings.includes(section)) errors.push(`${file} is missing the "${section}" section`);
      }
    }
  }
}
console.log(`Knowledge base: ${solutionCount} solution doc(s) checked.`);

// --- Result ----------------------------------------------------------------------------------

if (errors.length > 0) {
  console.error(`\n${errors.length} repository guard failure(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
console.log('\nRepository guards passed');
