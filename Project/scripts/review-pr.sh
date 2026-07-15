#!/usr/bin/env bash

set -e

PR_ID=$1

if [ -z "$PR_ID" ]; then
  echo "Usage: review-pr.sh <pr-number>"
  exit 1
fi

mkdir -p docs/pr-reviews

TITLE=$(gh pr view "$PR_ID" --json title -q .title)
BODY=$(gh pr view "$PR_ID" --json body -q .body)
AUTHOR=$(gh pr view "$PR_ID" --json author -q .author.login)
BRANCH=$(gh pr view "$PR_ID" --json headRefName -q .headRefName)

OUT="docs/pr-reviews/pr-$(printf "%03d" "$PR_ID").md"
DIFF="docs/pr-reviews/pr-$(printf "%03d" "$PR_ID").diff"

echo "Fetching PR #$PR_ID..."

gh pr diff "$PR_ID" > "$DIFF"

FILES=$(gh pr view "$PR_ID" --json files -q '.files[].path')
COMMITS=$(gh pr view "$PR_ID" --json commits -q '.commits[].messageHeadline')

cat <<EOF > "$OUT"
---
pr: $PR_ID
source: github
author: $AUTHOR
branch: $BRANCH
diff_file: $DIFF
---

# PR $PR_ID — $TITLE

## Author

$AUTHOR

## Branch

$BRANCH

## Description

$BODY

## Changed Files

$FILES

## Commits

$COMMITS

## Review Instructions

Review this PR for:

- correctness
- architecture fit
- readability
- unnecessary complexity
- missing validation
- database/API edge cases
- student-level clarity

Prefer actionable feedback over nitpicks.

When reviewing with Codex, ask:

> Review PR $PR_ID using $OUT and $DIFF. Focus on correctness, architecture, and clarity.
EOF

echo "Wrote review context:"
echo "$OUT"
echo
echo "Wrote diff:"
echo "$DIFF"
echo
echo "Suggested Codex prompt:"
echo "Review PR $PR_ID using $OUT and $DIFF. Focus on correctness, architecture, and clarity."