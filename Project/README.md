# Task Tracker

## First-Time Setup

1. In a terminal, navigate (`cd`) to the project directory. Once there, the current working directory should contain this `README.md` file along with files such as `docker-compose.yml`, `package.json`, and `.gitignore`.

2. With `Node.js` installed, run `npm install` to ensure all project dependencies are available.

3. Copy `.env.example` to a new file `.env`, then in the new file:

    - Update `JWT_SECRET` to a random string of at least 20 characters.

    - Add an admin name, email and password to the respective fields

4. Create the database with `npm run db:start`.

5. Run the following command to create the required database tables (`users`, `projects`, and `tasks`) within the database.

    - In `bash`:

        ```bash
        docker exec -i cs453-postgres psql -U postgres -d cs453 -f - < database/schema.sql
        ```

    - In `PowerShell` (Windows):

        ```shell
        Get-Content database/schema.sql | docker exec -i cs453-postgres psql -U postgres -d cs453
        ```

## Run the Program

1. In the main project directory containing this README file, run the API server with `npm run start`.

2. In a separate terminal, observe that `curl` commands work, e.g. `curl http://localhost:3000/db-health`.

    - Browser page does not exist. Client interactions can only occur via `curl`.

## Testing

The test script can be run with `npm run test`.

Please ensure you have completed the [first-time setup](#first-time-setup) before running the test.

When testing, whether for the first time or any subsequent time, ensure you have an empty database before running the test script.

- **The test will only work if the database is empty.**

If you want to empty the database, run the following commands:

<!-- markdownlint-disable MD029 -->
<!-- shut up the linter for now -->

1. Run the following commands:

    ```shell
    npm run db:reset; npm run db:start
    ```

2. Repeat [Setup Step 5](#first-time-setup)

<!-- markdownlint-enable MD029 -->

## Auth

- An admin account is created automatically on startup from the `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` values in `.env`.
- Register with `POST /auth/register` and log in with `POST /auth/login`; the login response returns a JWT as `token: <token>`.
- Send the JWT in requests as `Authorization: Bearer <token>`.

## Routes and Validation

**ID**: `:id` must be a positive integer.

**Schema**:

- `POST`/`PUT` require each resource's minimum create fields.
- `PATCH` requires at least one valid updatable field.
- Wrong types cause the request to be rejected.
- Extra fields get ignored.

**Authentication**:

- Protected routes require `Authorization: Bearer <jwt>`.
- Invalid or missing bearer tokens return `401`.

**Authorization**:

- All `/users` routes require the `admin` role.
- `/projects` routes require `user` or `admin`.
- `/tasks` routes require `user` or `admin`.
- A normal user becomes owner of projects they create.
- A normal user cannot modify another user's project.
- A normal user can create tasks only in projects they own.
- A normal user can update or delete a task if they own the task's project or are assigned to that task.
- An admin may access or modify any user, project, or task route guarded for admins.
- Authorization failures return `403`.

**Validation techniques**:

- Route param middleware `validator.ts` validates `:id` once and stores the parsed number in `res.locals`.
- Schema middleware (also `validator.ts`) validates create vs. partial-update bodies before write handlers run.
- Task authorization middleware `authenticator.ts` loads project/task ownership context before mutating a task i.e. when updating, replacing

### Routes

| Route | Validation |
| ----- | ---------- |
| GET `/health` | N/A |
| GET `/db-health` | N/A |
| POST `/auth/register` | Required fields: `name`, `email`, `password` |
| POST `/auth/login` | Required fields: `email`, `password` |
| GET `/users` | Auth, `admin` role |
| POST `/users` | Auth, `admin` role, **Schema** |
| GET `/users/:id` | Auth, `admin` role, **ID** |
| PUT `/users/:id` | Auth, `admin` role, **ID**, **Schema** |
| PATCH `/users/:id` | Auth, `admin` role, **ID**, **Schema** |
| DELETE `/users/:id` | Auth, `admin` role, **ID** |
| GET `/projects` | Auth, `user` or `admin` |
| POST `/projects` | Auth, `user` or `admin`, **Schema** |
| GET `/projects/:id` | Auth, `user` or `admin`, **ID** |
| PUT `/projects/:id` | Auth, `user` or `admin`, **ID**, **Schema** |
| PATCH `/projects/:id` | Auth, `user` or `admin`, **ID**, **Schema** |
| DELETE `/projects/:id` | Auth, `user` or `admin`, **ID** |
| GET `/tasks` | Auth, `user` or `admin` |
| GET `/tasks?project_id=1` | Auth, `user` or `admin`, query type check |
| POST `/tasks` | Auth, `user` or `admin`, **Schema**, project existence/ownership check |
| GET `/tasks/:id` | Auth, `user` or `admin`, **ID** |
| PUT `/tasks/:id` | Auth, `user` or `admin`, **ID**, **Schema**, task/project authorization check |
| PATCH `/tasks/:id` | Auth, `user` or `admin`, **ID**, **Schema**, task/project authorization check |
| DELETE `/tasks/:id` | Auth, `user` or `admin`, **ID**, task authorization check |

### curl examples

GET `/health`

```bash
curl http://localhost:3000/health
```

GET `/db-health`

```bash
curl http://localhost:3000/db-health
```

POST `/auth/register`

```bash
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com","password":"pass123"}'
```

POST `/auth/login`

```bash
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"alice@example.com","password":"pass123"}'
```

Example protected request with a token

```bash
curl http://localhost:3000/tasks -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

GET `/users`

```bash
curl http://localhost:3000/users -H "Authorization: Bearer ADMIN_TOKEN"
```

POST `/users`

```bash
curl -X POST http://localhost:3000/users -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com","password_hash":"hash123","role":"user"}'
```

GET `/users/:id`

```bash
curl http://localhost:3000/users/1 -H "Authorization: Bearer ADMIN_TOKEN"
```

PUT `/users/:id`

```bash
curl -X PUT http://localhost:3000/users/1 -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com","password_hash":"newhash","role":"admin"}'
```

PATCH `/users/:id`

```bash
curl -X PATCH http://localhost:3000/users/1 -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"role":"admin"}'
```

DELETE `/users/:id`

```bash
curl -X DELETE http://localhost:3000/users/1 -H "Authorization: Bearer ADMIN_TOKEN"
```

GET `/projects`

```bash
curl http://localhost:3000/projects -H "Authorization: Bearer USER_OR_ADMIN_TOKEN"
```

POST `/projects`

```bash
curl -X POST http://localhost:3000/projects -H "Authorization: Bearer USER_OR_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"Checkpoint API","description":"Course checkpoint project"}'
```

- For a normal user, `owner_id` is set to the authenticated user automatically.
- An admin may still supply `owner_id` if needed.

GET `/projects/:id`

```bash
curl http://localhost:3000/projects/1 -H "Authorization: Bearer USER_OR_ADMIN_TOKEN"
```

PUT `/projects/:id`

```bash
curl -X PUT http://localhost:3000/projects/1 -H "Authorization: Bearer USER_OR_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"Checkpoint API","description":"Updated description","owner_id":1}'
```

PATCH `/projects/:id`

```bash
curl -X PATCH http://localhost:3000/projects/1 -H "Authorization: Bearer USER_OR_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"description":"Patched description"}'
```

DELETE `/projects/:id`

```bash
curl -X DELETE http://localhost:3000/projects/1 -H "Authorization: Bearer USER_OR_ADMIN_TOKEN"
```

GET `/tasks`

```bash
curl http://localhost:3000/tasks -H "Authorization: Bearer USER_OR_ADMIN_TOKEN"
```

GET `/tasks?project_id=1`

```bash
curl http://localhost:3000/tasks?project_id=1 -H "Authorization: Bearer USER_OR_ADMIN_TOKEN"
```

- `project_id` must be a positive integer query value.

POST `/tasks`

```bash
curl -X POST http://localhost:3000/tasks -H "Authorization: Bearer USER_OR_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"title":"Implement auth","description":"Add login endpoint","status":"todo","project_id":1,"assigned_to":1}'
```

- `project_id` is required.
- `assigned_to` is optional.
- A normal user may only create the task inside a project they own.

POST `/tasks` (unassigned)

```bash
curl -X POST http://localhost:3000/tasks -H "Authorization: Bearer USER_OR_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"title":"Write docs","project_id":1}'
```

GET `/tasks/:id`

```bash
curl http://localhost:3000/tasks/1 -H "Authorization: Bearer USER_OR_ADMIN_TOKEN"
```

PUT `/tasks/:id`

```bash
curl -X PUT http://localhost:3000/tasks/1 -H "Authorization: Bearer USER_OR_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"title":"Implement auth","project_id":1}'
```

PATCH `/tasks/:id`

```bash
curl -X PATCH http://localhost:3000/tasks/1 -H "Authorization: Bearer USER_OR_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"assigned_to":2,"status":"in_progress"}'
```

DELETE `/tasks/:id`

```bash
curl -X DELETE http://localhost:3000/tasks/1 -H "Authorization: Bearer USER_OR_ADMIN_TOKEN"
```
