#!/usr/bin/env bash
# Shared helpers for the project hooks. Sourced, not executed.
#
# Why: inside a worktree session (`claude -w` / EnterWorktree), $CLAUDE_PROJECT_DIR stays at the
# main checkout, while the files being edited live in .claude/worktrees/<name>/. Every hook must
# resolve paths against the checkout that actually contains the file (or the session's cwd),
# never against $CLAUDE_PROJECT_DIR.

# Nearest existing directory for a path (a Write may create a file in a directory that doesn't exist yet).
existing_dir() {
  local d
  d=$(dirname "$1")
  while [ ! -d "$d" ] && [ "$d" != "/" ]; do d=$(dirname "$d"); done
  printf '%s\n' "$d"
}

# Top level of the git checkout (main checkout or worktree) that contains a path; empty if none.
repo_root_for() {
  git -C "$(existing_dir "$1")" rev-parse --show-toplevel 2>/dev/null
}

# Root to run checks in for a hook: the checkout containing the session's cwd, else $CLAUDE_PROJECT_DIR, else $PWD.
session_root() {
  local cwd="$1" root=""
  [ -n "$cwd" ] && [ -d "$cwd" ] && root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null)
  printf '%s\n' "${root:-${CLAUDE_PROJECT_DIR:-$PWD}}"
}
