---
title: "Changing the canonical Node runtime means regenerating the baselines there and proving the bodies are byte-identical"
date: 2026-11-07
category: baselines
module: scripts/regression/fixtures/
problem_type: convention
severity: high
tags: [baselines, fixtures, node, container, icu, tzdata, lockfile]
related: ["PR #7", "scripts/regression/fixtures/README.md"]
---

## Problem

CI was moved from the pinned `node:22.22.3-bookworm` container to Node 24 only. The baseline fixtures (`engine-baseline`, `patterns-baseline`, `birthtime-baseline`) record the environment they were generated in, and fixtures README rule 4 says changing the image means regenerating in the new canonical environment and reviewing the result like any engine change.

## Root cause

The fixtures pin engine output, but the output can depend on the runtime: Node's bundled ICU and tzdata changed from ICU 78.2 / tzdata 2026a (Node 22.22.3) to ICU 78.3 / tzdata 2026e (Node 24.22.2). Today's engine doesn't call `Intl` timezone APIs, but nothing guaranteed that before checking, and the Phase 3 timezone work will make tzdata matter.

## Solution

1. Pin the new image by the digest of its **linux/amd64** manifest (`docker buildx imagetools inspect node:24.22.2-bookworm`): `node:24.22.2-bookworm@sha256:6b9d4ea31e614e29f364bf75758458731eb1e105b80c99667438dd6b3fe262e0`.
2. Regenerate in that container into a scratch directory, never straight over the committed files: `npx tsx scripts/regression/fixtures/generate-baselines.ts --write --out /out` (full `docker run` command in the fixtures README).
3. Compare: all three body SHA-256 checksums were unchanged (engine `9685ea2c…`, patterns `0454bab8…`, birthtime `a4ee66e4…`), and `cmp` showed the `.jsonl.gz` files byte-identical. Only the three `.meta.json` files were copied in.
4. Update `.nvmrc` and `package.json` `engines` to `24.22.2`. `package-lock.json` can't be hand-edited (a hook blocks it), so regenerate it in the same container with `npm install --package-lock-only --ignore-scripts`; the diff was the root `engines` line only.
5. Run the CI steps in the container (`npm ci`, typecheck, `npm test`, build) before pushing.

Because the bodies didn't change, no `chart-diff-reviewer` report was needed.

## Prevention

- The `Repository guards` CI job (`.github/scripts/check-repo-guards.mjs`, check 2) fails if `.nvmrc`, `engines.node` and every workflow `container: image: node:<version>` don't name the same version.
- The baseline tests compare only the body; environment differences print an informational `ENVIRONMENT MISMATCH`, never a failure, so a metadata-only change can't be "fixed" by regenerating.
- If a future runtime change does alter a body, stop: that's a chart-output change and needs a `chart-diff-reviewer` report and evidence.

## Related

- PR #7 (`ci: run CI only on Node 24 and make it the canonical runtime`).
- `scripts/regression/fixtures/README.md` ("Canonical environment", "Regenerating").
- `docs/decisions/localization.md` D-7 (marked superseded by this change).
