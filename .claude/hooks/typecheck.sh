#!/usr/bin/env bash
# PostToolUse (Edit|Write): run an incremental tsc after editing a .ts/.tsx file.
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
if ! out=$(npx --no-install tsc --noEmit 2>&1); then
  echo "tsc --noEmit failed in $root after editing $f:" >&2
  echo "$out" | head -40 >&2
  exit 2
fi
exit 0
