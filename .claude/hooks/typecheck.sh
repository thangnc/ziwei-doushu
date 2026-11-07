#!/usr/bin/env bash
# PostToolUse (Edit|Write): run an incremental tsc after editing a .ts/.tsx file.
# Exit 2 = feed the errors back to Claude so it fixes them right away.
set -uo pipefail

f=$(jq -r '.tool_input.file_path // empty')
case "$f" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-$PWD}" || exit 0
if ! out=$(npx --no-install tsc --noEmit 2>&1); then
  echo "tsc --noEmit failed after editing $f:" >&2
  echo "$out" | head -40 >&2
  exit 2
fi
exit 0
