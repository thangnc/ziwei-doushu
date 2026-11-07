const path = require('node:path');

// Monorepo root (npm workspaces + Turborepo). Turbopack and output tracing must see the hoisted
// node_modules and the @ziwei/engine sources under packages/, both outside apps/web.
const repoRoot = path.join(__dirname, '..', '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // @ziwei/engine ships TypeScript source (no build step), so Next compiles it.
  transpilePackages: ['@ziwei/engine', 'lunar-javascript'],
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingRoot: repoRoot,
};

module.exports = nextConfig;
