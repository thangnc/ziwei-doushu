// `server-only` is a marker import: patterns.ts and famous.ts must never reach a client bundle.
// Next.js provides the module (and its types) when it compiles the web app, and the regression
// tests stub it with module.registerHooks. The engine package has no Next types of its own, so
// declare it here for `tsc` (TypeScript 6 checks side-effect imports). No runtime code.
// Files importing 'server-only' reference this file explicitly; see
// docs/solutions/workflow/a-source-only-workspace-package-must-reference-its-own-ambient-type-shims.md
declare module 'server-only';
