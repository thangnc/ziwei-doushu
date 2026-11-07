#!/usr/bin/env bash
# PostToolUse (Edit|Write): type-check after editing a .ts/.tsx file.
# Runs `npm run typecheck`, which in the monorepo layout is `turbo run typecheck` (every workspace,
# unchanged ones served from turbo's cache) plus `tsc` for the repo-level scripts. In a pre-monorepo
# checkout the same script is plain `tsc --noEmit`, so the hook works on both layouts.
# Exit 2 = feed the errors back to Claude so it fixes them right away.
set -uo pipefail
. "$(dirname "$0")/lib.sh"

f=$(jq -r '.tool_input.file_path // empty')
case "$f" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# Type-check the checkout that contains the edited file (a worktree has its own node_modules).
root=$(repo_root_for "$f")
[ -z "$root" ] && exit 0
cd "$root" || exit 0
if [ ! -x node_modules/.bin/tsc ]; then
  echo "Skipped tsc: $root has no node_modules yet. Run \`npm ci\` in this checkout (each worktree needs its own install)." >&2
  exit 2
fi
if ! out=$(TURBO_TELEMETRY_DISABLED=1 npm run --silent typecheck 2>&1); then
  echo "npm run typecheck failed in $root after editing $f:" >&2
  # Compiler errors first (turbo prefixes them with the workspace name), then the tail for context.
  { echo "$out" | grep -E 'error TS[0-9]+' | head -40; echo "$out" | tail -5; } >&2
  exit 2
fi
exit 0
