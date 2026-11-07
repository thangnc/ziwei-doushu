#!/usr/bin/env node
// Smoke test for the production build: start `next start` and request every top-level route.
//
// `npm run build` only proves the app compiles. This proves the built app actually serves its
// pages, and it pins the open-source boundary: the repo ships no `/api/*` routes, so the AI
// endpoints the demo calls must answer 404 (see README "What is not included"). If someone adds
// one of those routes, this fails and the change has to be deliberate.
//
// Run after `npm run build`, from the repository root: node .github/scripts/smoke-routes.mjs
// Env: SMOKE_PORT (default 3000), SMOKE_READY_TIMEOUT_MS (default 60000).
// Node standard library only.

import { spawn } from 'node:child_process';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.SMOKE_PORT ?? 3000);
const READY_TIMEOUT_MS = Number(process.env.SMOKE_READY_TIMEOUT_MS ?? 60_000);
const BASE = `http://127.0.0.1:${PORT}`;

const EXPECT = [
  ['/', 200],
  ['/chart', 200],
  ['/heming', 200],
  ['/library', 200],
  ['/knowledge', 200],
  ['/privacy', 200],
  ['/terms', 200],
  ['/robots.txt', 200],
  ['/sitemap.xml', 200],
  // The open-source boundary: these back the AI features and are deliberately absent.
  ['/api/interpret', 404],
  ['/api/heming', 404],
];

// The web app is the apps/web workspace; npm workspaces hoist the `next` binary to the root node_modules.
const server = spawn(path.resolve('node_modules/.bin/next'), ['start', '-p', String(PORT), '-H', '127.0.0.1'], {
  cwd: 'apps/web',
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk; });
server.stderr.on('data', (chunk) => { serverLog += chunk; });
let exited = false;
server.on('exit', () => { exited = true; });

async function waitForServer() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (exited) throw new Error('next start exited before it became ready');
    try {
      await fetch(BASE, { signal: AbortSignal.timeout(2_000) });
      return;
    } catch {
      await sleep(500);
    }
  }
  throw new Error(`next start was not ready after ${READY_TIMEOUT_MS} ms`);
}

let failures = 0;
try {
  await waitForServer();
  for (const [path, expected] of EXPECT) {
    let status;
    try {
      const res = await fetch(BASE + path, { redirect: 'manual', signal: AbortSignal.timeout(30_000) });
      status = res.status;
      await res.arrayBuffer();
    } catch (error) {
      status = `error (${error.message})`;
    }
    const ok = status === expected;
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${String(status).padEnd(4)} ${path} (expected ${expected})`);
  }
} catch (error) {
  failures++;
  console.error(`FAIL ${error.message}`);
} finally {
  server.kill('SIGTERM');
}

if (failures > 0) {
  console.error(`\n${failures} smoke check(s) failed. next start output:\n${serverLog}`);
  process.exit(1);
}
console.log('\nSmoke test passed');
