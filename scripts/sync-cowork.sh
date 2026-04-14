#!/usr/bin/env bash
# Sync Claude context from this repo into the Cowork project folder.
# The repo is the source of truth. Edit CLAUDE.md / .claude/ here,
# then run this script to propagate to the Cowork directory.
#
# Usage:   ./scripts/sync-cowork.sh
# Override destination:  COWORK_DIR="$HOME/Workout App" ./scripts/sync-cowork.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COWORK_DIR="${COWORK_DIR:-$HOME/Documents/Claude/Projects/Workout App}"

if [[ ! -d "$COWORK_DIR" ]]; then
  echo "Cowork directory not found: $COWORK_DIR" >&2
  echo "Set COWORK_DIR env var or create the folder." >&2
  exit 1
fi

echo "Syncing Claude context"
echo "  from: $REPO_DIR"
echo "  to:   $COWORK_DIR"

# CLAUDE.md — single file
cp "$REPO_DIR/CLAUDE.md" "$COWORK_DIR/CLAUDE.md"
echo "  ✓ CLAUDE.md"

# .claude/ — mirror, deleting files in dest that no longer exist in source
if [[ -d "$REPO_DIR/.claude" ]]; then
  rsync -a --delete "$REPO_DIR/.claude/" "$COWORK_DIR/.claude/"
  echo "  ✓ .claude/ (mirrored)"
fi

echo "Done."
