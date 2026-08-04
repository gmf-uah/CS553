# CS453 Take-Home Final Starter

This repository supplies the local infrastructure for Parts 3–5 of the CS453 take-home final. It is deliberately incomplete: implement only the clearly marked exam TODOs. It uses a local SQLite file and an in-process educational queue, so it needs no PostgreSQL, Redis, Docker, or external service.

## Requirements and setup

Use Node.js 20 or later.

```bash
npm install
cp .env.example .env
npm run db:init
npm run tokens
npm start
```

`npm run tokens` prints short-lived development JWTs only. It does not implement OAuth or a production login system. Start the server in watch mode with `npm run dev`.

Use a token in a request with this header syntax (replace the placeholder locally):

```text
Authorization: Bearer <token>
```

For example, a request can be sent with `curl -H "Authorization: Bearer <token>" http://localhost:3000/tasks`. The authentication and authorization behavior is part of the exam and is intentionally unfinished.

## File map

| Exam part | Files |
| --- | --- |
| Part 3: JWT authentication and roles | `src/middleware/auth.js`, `src/routes/tasks.js` |
| Part 4: task lookup and ownership | `src/routes/tasks.js`, `src/database.js` |
| Part 5: report workflow | `src/routes/reports.js`, `src/workers/reportWorker.js`, `src/reportQueue.js`, `src/reportGenerator.js` |

## Student TODO checklist

- `TODO(PART 3)`: implement JWT authentication, role authorization, and apply the required middleware to task routes.
- `TODO(PART 4)`: implement the parameterized task lookup, 404 behavior, instructor access, and student ownership check.
- `TODO(PART 5)`: create and enqueue report jobs, return `202 Accepted`, and complete the worker status workflow.

Search for `TODO(PART` to find every graded location. The queue, database schema, report generator, and general error handling are supplied infrastructure, not exam work.

## Notes

The in-process queue is a small educational stand-in for RabbitMQ, Redis/BullMQ, SQS, or Kafka. It is FIFO within this process but not durable; messages disappear if the process stops.

Queue configuration, OAuth implementation, HTTPS certificate creation, and database schema creation are not student responsibilities. The starter uses HTTP locally; any production HTTPS/OpenAPI documentation belongs in the exam response as directed.

Do not commit `.env`, generated database files under `data/`, printed tokens, `node_modules`, or coverage output. Run the supplied infrastructure tests with `npm test`.
