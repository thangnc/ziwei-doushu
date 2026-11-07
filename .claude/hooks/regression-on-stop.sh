#!/usr/bin/env bash
# Stop: if the engine or the regression tests changed, run `npm test` (~22s).
# On failure, block the stop so Claude sees the failure and fixes it.
# Skips when nothing relevant changed, or when this exact change set already passed.
set -uo pipefail
. "$(dirname "$0")/lib.sh"

input=$(cat)
# Already continuing because of a previous Stop-hook block: don't loop.
[ "$(echo "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0

# Test the checkout the session is working in: in a worktree session, cwd is the worktree,
# while $CLAUDE_PROJECT_DIR still points at the main checkout.
cd "$(session_root "$(echo "$input" | jq -r '.cwd // empty')")" || exit 0
[ -d node_modules ] || { echo '{"systemMessage": "Regression tests skipped: no node_modules in this checkout (run npm ci)."}'; exit 0; }
paths=(lib/ziwei scripts/regression package.json)

changed=$( { git diff HEAD --name-only -- "${paths[@]}"; git ls-files --others --exclude-standard -- "${paths[@]}"; } 2>/dev/null )
[ -z "$changed" ] && exit 0

# Fingerprint the change set (diff + untracked file contents) and skip if it already passed.
stamp_dir="${TMPDIR:-/tmp}/claude-ziwei-regression"
mkdir -p "$stamp_dir"
fp=$( { git diff HEAD -- "${paths[@]}"; git ls-files --others --exclude-standard -z -- "${paths[@]}" | xargs -0 cat 2>/dev/null; } | shasum | cut -c1-40)
[ -f "$stamp_dir/$fp" ] && exit 0

if out=$(npm test 2>&1); then
  touch "$stamp_dir/$fp"
  echo '{"systemMessage": "Engine regression tests passed (npm test)."}'
  exit 0
fi

tail_out=$(echo "$out" | tail -40)
jq -n --arg r "npm test failed after changes to: $(echo "$changed" | tr '\n' ' ')
$tail_out" '{decision: "block", reason: $r}'
exit 0
