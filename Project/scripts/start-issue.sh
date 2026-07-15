#!/bin/bash

ISSUE_ID=$1

if [ -z "$ISSUE_ID" ]; then
  echo "Usage: start-issue <issue-number>"
  exit 1
fi

# Get issue title
TITLE=$(gh issue view $ISSUE_ID --json title -q .title)

# Create safe branch name
BRANCH_NAME="issue-${ISSUE_ID}-$(echo $TITLE | tr ' ' '-' | tr -cd '[:alnum:]-' | tr '[:upper:]' '[:lower:]')"

echo "Creating branch: $BRANCH_NAME"

git checkout -b $BRANCH_NAME

echo "Opening issue..."
gh issue view $ISSUE_ID