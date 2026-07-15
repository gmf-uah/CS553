#!/bin/bash

ISSUE_ID=$1

git add .
git commit -m "Implements issue #$ISSUE_ID"

git push -u origin HEAD

gh pr create --fill