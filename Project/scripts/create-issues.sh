#!/usr/bin/env bash

set -e

echo "Creating CS453 project milestone issues..."

gh issue create \
  --title "Milestone 1 — Basic Task API" \
  --label "milestone-1,student,api" \
  --body "$(cat <<'EOF'
## Goal

Implement a basic REST API backed by PostgreSQL.

## Requirements

- [ ] GET /tasks
- [ ] POST /tasks
- [ ] Validate input: title is required
- [ ] Return proper HTTP status codes
- [ ] Handle errors gracefully

## Deliverable

Working API that supports creating and retrieving tasks.

## Notes

- Use raw SQL
- Do not use an ORM
- Keep implementation simple and readable
EOF
)"

gh issue create \
  --title "Milestone 2 — Full Task CRUD" \
  --label "milestone-2,student,api" \
  --body "$(cat <<'EOF'
## Goal

Extend the task API to support full CRUD behavior.

## Requirements

- [ ] GET /tasks/:id
- [ ] PATCH /tasks/:id
- [ ] DELETE /tasks/:id
- [ ] Update task status
- [ ] Return 404 when a task does not exist

## Deliverable

Fully functional task CRUD API.
EOF
)"

gh issue create \
  --title "Milestone 3 — Refactor API Structure" \
  --label "milestone-3,student,architecture" \
  --body "$(cat <<'EOF'
## Goal

Refactor the API into a more maintainable structure.

## Requirements

- [ ] Move task routes into routes/
- [ ] Create a service layer
- [ ] Move SQL/database logic out of server.ts
- [ ] Keep route handlers thin
- [ ] Update documentation if needed

## Deliverable

A cleaner API architecture with separation of concerns.
EOF
)"

gh issue create \
  --title "Milestone 4 — Expand Data Model" \
  --label "milestone-4,student,database" \
  --body "$(cat <<'EOF'
## Goal

Introduce relational data modeling.

## Requirements

- [ ] Add users table
- [ ] Add projects table
- [ ] Add task-to-project relationship
- [ ] Add task-to-user assignment relationship
- [ ] Add appropriate foreign keys

## Deliverable

Multi-entity database model supporting users, projects, and tasks.
EOF
)"

gh issue create \
  --title "Milestone 5 — Authentication" \
  --label "milestone-5,student,auth" \
  --body "$(cat <<'EOF'
## Goal

Add authentication to the system.

## Requirements

- [ ] Add user registration endpoint
- [ ] Add login endpoint
- [ ] Hash passwords securely
- [ ] Generate JWT access tokens
- [ ] Add authentication middleware
- [ ] Protect task/project routes

## Deliverable

Authenticated API with protected routes.
EOF
)"

gh issue create \
  --title "Milestone 6 — Authorization and Ownership" \
  --label "milestone-6,student,auth" \
  --body "$(cat <<'EOF'
## Goal

Add authorization rules beyond simple login.

## Requirements

- [ ] Restrict task access by project membership
- [ ] Add project ownership or membership model
- [ ] Enforce 401 vs 403 behavior correctly
- [ ] Prevent users from modifying resources they do not own

## Deliverable

Multi-user system with meaningful access control.
EOF
)"

gh issue create \
  --title "Milestone 7 — Real-Time Updates with WebSockets" \
  --label "milestone-7,student,realtime" \
  --body "$(cat <<'EOF'
## Goal

Add real-time client/server communication.

## Requirements

- [ ] Add WebSocket server
- [ ] Broadcast task creation/update events
- [ ] Connect browser client to WebSocket server
- [ ] Demonstrate live updates without page refresh

## Deliverable

Real-time task update behavior.
EOF
)"

gh issue create \
  --title "Milestone 8 — GraphQL API Extension" \
  --label "milestone-8,student,graphql" \
  --body "$(cat <<'EOF'
## Goal

Expose selected functionality through GraphQL.

## Requirements

- [ ] Add GraphQL endpoint
- [ ] Define task/project schema
- [ ] Implement queries
- [ ] Implement at least one mutation
- [ ] Compare REST and GraphQL design tradeoffs

## Deliverable

Working GraphQL API alongside REST API.
EOF
)"

gh issue create \
  --title "Instructor Task — Create Milestone Rubrics" \
  --label "instructor,grading" \
  --body "$(cat <<'EOF'
## Goal

Create grading rubrics for the semester project milestones.

## Rubrics Needed

- [ ] Milestone 1 rubric
- [ ] Milestone 2 rubric
- [ ] Milestone 3 rubric
- [ ] Milestone 4 rubric
- [ ] Milestone 5 rubric
- [ ] Final project rubric

## Notes

Rubrics should evaluate correctness, architecture, code clarity, and documentation.
EOF
)"

gh issue create \
  --title "Instructor Task — Create Student Setup Guide" \
  --label "instructor,docs" \
  --body "$(cat <<'EOF'
## Goal

Create setup instructions for students.

## Requirements

- [ ] Install Git
- [ ] Install nvm
- [ ] Install Node LTS
- [ ] Install Docker
- [ ] Clone repository
- [ ] Start PostgreSQL
- [ ] Run API server
- [ ] Test /health and /db-health

## Deliverable

A clear setup guide suitable for students.
EOF
)"

echo "Done creating issues."