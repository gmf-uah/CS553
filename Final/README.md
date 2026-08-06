`answers.md` contains the bulk of the work for this exam, along with the source code files specified in [File map](#file-map).

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