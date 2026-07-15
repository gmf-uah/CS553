#!/usr/bin/env bash

set -e

ISSUE_ID=$1

if [ -z "$ISSUE_ID" ]; then
  echo "Usage: pull-issue <issue-number>"
  exit 1
fi

mkdir -p docs/issues

# Get issue data
TITLE=$(gh issue view "$ISSUE_ID" --json title -q .title)
BODY=$(gh issue view "$ISSUE_ID" --json body -q .body)

# Create safe filename
SLUG=$(echo "$TITLE" | tr ' ' '-' | tr -cd '[:alnum:]-' | tr '[:upper:]' '[:lower:]')
FILE="docs/issues/$(printf "%03d" "$ISSUE_ID")-$SLUG.md"

echo "Writing $FILE..."

cat <<EOF > "$FILE"
---
issue: $ISSUE_ID
source: github
---

# Issue $ISSUE_ID — $TITLE

$BODY
EOF

echo "Done."