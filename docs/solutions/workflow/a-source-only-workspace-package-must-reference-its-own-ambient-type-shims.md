---
title: "A source-only workspace package must reference its own ambient type shims, or every consumer that compiles it fails"
date: 2026-11-08
category: workflow
module: packages/ziwei-engine/src/
problem_type: tooling
severity: medium
tags: [monorepo, turborepo, typescript, workspaces, server-only, lunar-javascript]
related: ["PR #20"]
---

## Problem

When the engine moved from `lib/ziwei/` into the workspace package `packages/ziwei-engine` (`@ziwei/engine`, exported as TypeScript source via `"exports": { "./*": "./src/*.ts" }`), each program that compiled the engine's sources failed in a different way:

- `tsc` inside the engine package:
  ```
  src/famous.ts(6,8): error TS2882: Cannot find module or type declarations for side-effect import of 'server-only'.
  src/patterns.ts(18,8): error TS2882: Cannot find module or type declarations for side-effect import of 'server-only'.
  ```
- `tsc` in `apps/web` (which imports `@ziwei/engine/*`) and the root `tsc` for `scripts/`:
  ```
  ../../packages/ziwei-engine/src/algorithm.ts(7,35): error TS7016: Could not find a declaration file for module 'lunar-javascript'. '…/node_modules/lunar-javascript/index.js' implicitly has an 'any' type.
  ```

Before the move, a single root `tsconfig.json` with `include: ["**/*.ts"]` compiled everything, so neither problem showed up.

## Root cause

- **`lunar-javascript`:** the package ships no types. The engine's ambient shim `lunar-javascript.d.ts` (`declare module 'lunar-javascript' { … }`) was found only because the old root `include` glob matched it. A consumer that reaches engine files through imports never pulls in a `.d.ts` that nothing imports, so `apps/web` and the root scripts saw the module as untyped (`strict` makes that TS7016).
- **`server-only`:** it isn't an installed dependency. Next provides it at build time, and its declaration came from Next's types in the old root program. The engine package has no Next types, and TypeScript 6 checks side-effect imports (TS2882), so `import 'server-only'` stopped resolving.

## Solution

Keep the shims inside the engine and make them travel with the sources that need them (PR #20):

- `packages/ziwei-engine/src/server-only.d.ts` declares the module (`declare module 'server-only';`). There is no runtime code: Next supplies the real module, and the tests stub it with `module.registerHooks`.
- Every engine file that imports one of these modules starts with a triple-slash reference to its shim:
  - `/// <reference path="./lunar-javascript.d.ts" />` in `algorithm.ts`, `lunar-solar.ts`, `sihua.ts`
  - `/// <reference path="./server-only.d.ts" />` in `patterns.ts`, `famous.ts`

  Any program that compiles one of those files (engine `tsc`, web `tsc`, root `tsc`, Next/Turbopack) now loads the declaration too, with no cross-package `include` entries. Chart output is unchanged: 832/832 sweep charts are byte-identical, and so are all three baseline bodies.

## Prevention

- `npm run typecheck` runs `turbo run typecheck` (engine and web separately) plus the root `tsc`, so a missing shim fails in CI's Typecheck job, not just in one program.
- When an engine file starts importing an untyped package, or another marker module like `server-only`, add or extend a shim in `packages/ziwei-engine/src/` **and** a `/// <reference path>` in that file. Don't add the shim to a consumer's `tsconfig.json` `include`.
- `packages/ziwei-engine/test/engine-import-boundary.test.ts` limits engine imports to `iztro`, `lunar-javascript` and `server-only`, so the set of shims to maintain stays this small.

## Related

- PR #20 (npm workspaces + Turborepo: `apps/web`, `packages/ziwei-engine`)
- `packages/ziwei-engine/src/lunar-javascript.d.ts`, `packages/ziwei-engine/src/server-only.d.ts`
- `packages/ziwei-engine/test/engine-import-boundary.test.ts`
