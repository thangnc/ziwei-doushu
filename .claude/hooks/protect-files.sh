#!/usr/bin/env bash
# PreToolUse (Edit|Write): block edits to files that must not be hand-edited.
# Exit 2 = block the tool call; stderr is shown to Claude.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

f=$(jq -r '.tool_input.file_path // empty')
[ -z "$f" ] && exit 0
# Relative to the checkout that contains the file (main checkout or a worktree), so the rules
# below also match .claude/worktrees/<name>/package-lock.json and friends.
root=$(repo_root_for "$f" || true)
[ -z "$root" ] && exit 0
rel="${f#"$root"/}"

case "$rel" in
  lib/ziwei/school-tables.generated.ts)
    echo "Blocked: $rel is generated (勿手改) and its generator scripts/extract-school-tables.ts is not in this repo. Ask the user before changing it." >&2
    exit 2 ;;
  docs/tianji-ziwei/*)
    echo "Blocked: $rel is synced from the nihai-tianji-corpus repo (CC BY-NC-SA). Fix it upstream, not here." >&2
    exit 2 ;;
  package-lock.json)
    echo "Blocked: don't hand-edit package-lock.json; change package.json and run npm install." >&2
    exit 2 ;;
  .env|.env.*)
    [ "$rel" = ".env.example" ] && exit 0
    echo "Blocked: $rel may hold secrets; edit it yourself if needed." >&2
    exit 2 ;;
esac
exit 0
