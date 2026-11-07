# Baseline fixtures (change detectors)

Phase 0 / D5 of the Vietnamese-localization plan. These fixtures pin the **current** output of:
- the charting engine
- pattern detection
- the form's birth-time conversion

They exist so that later localization and refactoring can show that this output **did not change**.

> **Path update 2026-11-08:** the repo became an npm-workspaces + Turborepo monorepo. These fixtures moved from `scripts/regression/fixtures/` to `packages/ziwei-engine/test/fixtures/`, and the engine from `lib/ziwei/` to `packages/ziwei-engine/src/`. References to `lib/ziwei/…:<line>` below describe the code as it stood when the fixtures were generated. The bodies are unchanged by the move.

> **A fixture detects change; it doesn't prove correctness.** Matching a fixture means "same as on the day it was generated", not "correct". Expected values in ordinary regression tests still come from references, not from a fixture (see `.claude/rules/regression-tests.md`).

## Inventory

| Fixture (body / metadata) | What it pins | Records | Uncompressed | Stored (gzip -9) | Body SHA-256 |
|---|---|---|---|---|---|
| `engine-baseline.zh.jsonl.gz` / `.meta.json` | Full `generateChart()` output minus date-dependent fields | 1,440 | 11,915,644 B | 451,554 B | `9685ea2c2ffa33218ba1f26ad9e4f5a809dddb5446e5d15a1613f43eebc5f5ec` |
| `patterns-baseline.zh.jsonl.gz` / `.meta.json` | Full `detectPatterns()` output for the same 1,440 charts | 1,440 | 2,525,050 B | 135,492 B | `0454bab87a46168eccd0915680eff4244e2ef476bdf719ccf0a6c9101bf69bf2` |
| `birthtime-baseline.zh.jsonl.gz` / `.meta.json` | `formToBirthInfo()` + `calcTrueSolarBranch()` (`lib/ziwei/share.ts`) | 3,104 | 563,886 B | 13,842 B | `a4ee66e4f3920b709292b1246d0c79e41f82ba000dfb9c7c38316960e54bbced` |

- **Format:** one record per line, `"<key>"<TAB><JSON>`, with keys in a stable order. Bodies are stored gzip-compressed. Both the checksum and the comparison work on the **uncompressed UTF-8 text**, so a different zlib producing different compressed bytes can't cause a false failure.
- **Excluded from the engine body:** `currentAge`, `currentDaXianIndex` and `palaces[].isCurrentDaXian`. These depend on today's date (`lib/ziwei/algorithm.ts:589–600`, `:643–671`, via iztro `horoscope()`). Nothing else in a chart depends on the current date (`algorithm.ts` has no other `new Date()`).

### Input coverage (`baseline-lib.ts`)

**Engine and patterns: 1,440 cases**

| Group | Inputs | Count |
|---|---|---|
| A | 1960–2010 step 7 years × months 1/4/7/10 × days 5/15/25 × 时辰 0/3/6/9 × male/female. Default settings: QS brightness, `split` leap policy | 832 |
| B | 18 boundary dates × all 12 时辰 × 2 genders. The dates: 立春 vs 正月初一 (1984-02-04/05, 1999-02-04/11/16, 2001-01-23/24), month and year ends (1990-01-31, 1990-12-31, 1991-01-01), 2000-02-28/29 and 03-01, 2001-02-28, and other edge dates (2004-03-21, 2006-08-24, 2023-04-19, 2026-11-07) | 432 |
| C | 7 leap-month birth dates × 4 leap policies (`split` / `next-month` / `prev-month` / `origin-month`) × 时辰 0/6 × 2 genders. The dates are in 闰四月 2020, 闰二月 2023, 闰六月 2017, 闰六月 1987 and 闰八月 1995. Generation **asserts** each one is really a leap month (`rawLunarMonth < 0`), so this group can't silently test nothing. | 112 |
| D | 4 brightness schools (QS / XD1 / ZZ / XD2) × 1960–2010 step 14 years × months 1/7 × day 15 × 时辰 0/6 × 2 genders | 64 |

**Birth time: 3,104 records**
- Cities: 北京 116.4, 上海 121.47, 哈尔滨 126.63, 乌鲁木齐 87.62, 喀什 75.99, 拉萨 91.13.
- Dates: 8, including 1988-07-01 during China DST, plus month and year ends and leap days.
- For each city and date: the clock minutes within **±2 minutes of every 时辰 boundary**, after the `(λ−120)×4` offset is applied.
- No-location cases: every full hour, plus 23:00 / 23:30 / 23:59 (late 子时).
- Unknown-time cases.

## Canonical environment

| Item | Value |
|---|---|
| Image | `node:24.22.2-bookworm@sha256:6b9d4ea31e614e29f364bf75758458731eb1e105b80c99667438dd6b3fe262e0`: the **linux/amd64** manifest of the multi-arch index `sha256:8fa96264f302f58bbb13aa7339c541547b56975766ce956c875da149452a3e40`, created 2026-11-05 |
| OS / arch | Debian 12 (bookworm), linux x64 |
| Node / npm | v24.22.2 / 11.19.1 |
| ICU / tzdata / Unicode | 78.3 / 2026e / 17.0 |
| iztro / lunar-javascript | 2.6.5 / 1.7.8 (from `package-lock.json` via `npm ci`) |

**Switch to Node 24, 2026-11-07.** The canonical runtime moved from `node:22.22.3-bookworm@sha256:46e94f8c…` (Node 22.22.3, npm 10.9.8, ICU 78.2, tzdata 2026a) to the image above, and CI now runs only on it.
- The fixtures were regenerated with `--write` in the new container. All three bodies came out **byte-identical** (same SHA-256 as before, and the `.jsonl.gz` files are byte-for-byte unchanged), so no chart output changed and no `chart-diff-reviewer` report applies.
- Only the `.meta.json` files changed: Node, npm, ICU, tzdata, image, git commit, timestamp, and the iztro / lunar-javascript versions from the 2026-11-07 dependency update.
- `.nvmrc` and `package.json` `engines` are now `24.22.2`.

**Earlier dependency update, 2026-11-07:** iztro 2.6.1 → 2.6.5 and lunar-javascript 1.7.7 → 1.7.8 left all three bodies byte-identical; the Node 24 regeneration above refreshed that metadata.

**CI uses the same image.** `.github/workflows/ci.yml` runs every job that uses Node (repository guards, typecheck, chart regression, build and smoke test) in `container:` with this digest, instead of `setup-node` with `node-version: '24'`, which would float to the newest 24.x and its ICU/tzdata. So the generation and verification environments are identical.

**Local development** uses `.nvmrc` (`24.22.2`) and `package.json` `engines`. Local runs are **Node-runtime-compatible, not environment-identical**: macOS on arm64 is a different OS and architecture. They are for development only; **fixtures are never generated locally.**

## Regenerating (deliberate, reviewed only)

Tests are read-only; they never write, regenerate or overwrite fixtures. The generator refuses to run without `--write`.

```bash
IMG=node:24.22.2-bookworm@sha256:6b9d4ea31e614e29f364bf75758458731eb1e105b80c99667438dd6b3fe262e0
# copy the repo, minus node_modules and .next, to SRC; then:
docker run --rm --platform linux/amd64 -v "$SRC":/src:ro -v "$OUT":/out \
  -e BASELINE_IMAGE="$IMG" -e BASELINE_RUNTIME=container -e BASELINE_GIT_COMMIT="$(git rev-parse HEAD)" "$IMG" \
  sh -c 'cp -r /src /work && cd /work && npm ci && npx tsx packages/ziwei-engine/test/fixtures/generate-baselines.ts --write --out /out'
# determinism check (generates twice, writes nothing):
#   npx tsx packages/ziwei-engine/test/fixtures/generate-baselines.ts --check-determinism
```

Rules:
1. **A body mismatch always fails `npm test`.** Investigate it. Only regenerate when the change is intended, and attach a `chart-diff-reviewer` report and the evidence that the project rules require for any change to chart output.
2. **Metadata differences never fail a test and never cause a regeneration.** These include Node, npm, ICU, tzdata, OS, arch, image, git commit and timestamp. The verifier prints an `ENVIRONMENT MISMATCH` report and still passes if the body matches.
3. Fixtures generated outside the canonical image must be labelled **non-canonical** in the commit message and here, and regenerated canonically before merging.
4. Bumping iztro or lunar-javascript, or changing the image, means regenerating in the new canonical environment and reviewing the body diff like any engine change.

## Phase 0 results (2026-11-07)

### Determinism

The bodies were generated twice in the canonical container with `--check-determinism`. All three gave **identical** SHA-256 checksums (above), about 55 s per generation under amd64 emulation.

### Verification runs

| Environment | `npm run typecheck` | `npm test` (all 20 tests, the 3 baselines last) | Environment report |
|---|---|---|---|
| **Canonical container** (amd64, emulated on Apple silicon; wall time 4 m 04 s including `npm ci`) | pass | pass, `TEST_EXIT=0`; all 3 bodies match | **no mismatch** |
| Local macOS arm64, Node 22.22.3 via nvm (1 m 24 s) | pass | pass; all 3 bodies match | mismatch in platform, arch and image only (informational) |
| Local macOS arm64, Node 26.0.0 (compatibility check, 1 m 42 s) | (typecheck run under Node 22) | pass; all 3 bodies match | mismatch in node v26.0.0, npm 11.12.1, **ICU 78.3 vs 78.2**, platform, arch and image (informational) |

**Observations:**
- All three bodies are **byte-identical** across linux/amd64 + Node 22, darwin/arm64 + Node 22 and darwin/arm64 + Node 26. Today's engine and birth-time code doesn't call `Intl` timezone APIs, so ICU doesn't affect these bodies yet.
- Once server-side timezone resolution is added (Phase 3), ICU/tzdata **will** affect results. That's why the canonical image is pinned now.
- The first container attempt failed in the existing `neutral-naming.test.ts`, because it calls `git ls-files` and my copy of the repo left out `.git`. Rerun with `.git` included, as `actions/checkout` provides, it passed. This was a problem with my copy, not with CI.
- **Node 26 compatibility** is a separate check from baseline verification, as decided.
- **Node 24 compatibility job (added 2026-11-07, removed the same day when Node 24 became the canonical runtime; see above):** `.github/workflows/ci.yml` job `node24` ran `typecheck`, `test` and `build` on the latest Node 24 (`setup-node`, floating 24.x) with `continue-on-error: true`, so it never blocks. Its `ENVIRONMENT MISMATCH` reports are informational. A body mismatch there is opened as an issue for investigation and **never** leads to a fixture update. Local check on Node 24.22.2 (npm 11.19.1, ICU 78.3, tzdata 2026e): all tests and the build passed, and all 3 bodies matched.
