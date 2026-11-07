#!/usr/bin/env bash
# PreToolUse (Edit|Write|NotebookEdit): implementation and bug fixes happen in a git worktree,
# never in the main checkout. Exit 2 = block the tool call; stderr is shown to Claude.
#
# A checkout is the main one when its git dir equals the common git dir; a linked worktree has its
# own git dir under .git/worktrees/<name>. Files outside this repository (memory, scratchpad,
# other repos) are not affected.
#
# Escape hatch for a deliberate edit in the main checkout (e.g. a one-line doc fix you asked for):
# create the gitignored marker file `.claude/allow-main-edits` in the main checkout; delete it afterwards.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

f=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -z "$f" ] && exit 0

dir=$(existing_dir "$f")
git_dir=$(git -C "$dir" rev-parse --path-format=absolute --git-dir 2>/dev/null) || exit 0
common_dir=$(git -C "$dir" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0

# Only this project's repository.
project_common=$(git -C "${CLAUDE_PROJECT_DIR:-$PWD}" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0
[ "$common_dir" = "$project_common" ] || exit 0

# Linked worktree: allowed.
[ "$git_dir" != "$common_dir" ] && exit 0

root=$(git -C "$dir" rev-parse --show-toplevel)
[ -e "$root/.claude/allow-main-edits" ] && exit 0

cat >&2 <<EOF
Blocked: $f is in the main checkout. Implementation and bug fixes are done in a git worktree
(.claude/rules/workflow.md → Worktrees). Call EnterWorktree (or use /start-work), then edit the
same file inside the worktree. If the user explicitly wants this edit made in the main checkout,
ask them to create .claude/allow-main-edits there.
EOF
exit 2
