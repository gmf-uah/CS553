# Task Tracker

## First-Time Setup

1. In a terminal, navigate (`cd`) to the project directory. Once there, the current working directory should contain this `README.md` file along with files such as `docker-compose.yml`, `package.json`, and `.gitignore`.

2. With `Node.js` installed, run `npm install` to ensure all project dependencies are available.

3. Copy and paste the `.env.example` file, rename it to `.env`, then open the new file and edit the value JWT_SECRET to be a random string of at least 20 characters.

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

Ensure you have an empty database before running the test script.

If you want to empty the database, run the following commands:

<!-- markdownlint-disable MD029 -->
<!-- shut up the linter for now -->

1. Run the following commands:

    ```shell
    npm run db:reset; npm run db:start
    ```

2. Repeat [Setup Step 5](#first-time-setup)

<!-- markdownlint-enable MD029 -->

## Routes and Validation

**ID**: `:id` must be a positive integer.

**Schema**:

- `POST`/`PUT` require each resource's minimum create fields.
- `PATCH` requires at least one valid updatable field.
- Wrong types cause the request to be rejected.
- Extra fields get ignored.

### Routes

| Route | Validation |
| ----- | ---------- |
| GET `/health` | N/A |
| GET `/db-health` | N/A |
| GET `/users` | N/A |
| POST `/users` | **Schema** |
| GET `/users/:id` | **ID** |
| PUT `/users/:id` | **ID**, **Schema** |
| PATCH `/users/:id` | **ID**, **Schema** |
| DELETE `/users/:id` | **ID** |
| GET `/projects` | N/A |
| POST `/projects` | **Schema** |
| GET `/projects/:id` | **ID** |
| PUT `/projects/:id` | **ID**, **Schema** |
| PATCH `/projects/:id` | **ID**, **Schema** |
| DELETE `/projects/:id` | **ID** |
| GET `/tasks` | N/A |
| GET `/tasks?project_id=1` | Query type check |
| POST `/tasks` | **Schema** |
| GET `/tasks/:id` | **ID** |
| PUT `/tasks/:id` | **ID**, **Schema** |
| PATCH `/tasks/:id` | **ID**, **Schema** |
| DELETE `/tasks/:id` | **ID** |

### curl examples

GET `/health`

```bash
curl http://localhost:3000/health
```

GET `/db-health`

```bash
curl http://localhost:3000/db-health
```

GET `/users`

```bash
curl http://localhost:3000/users
```

POST `/users`

```bash
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com","password_hash":"hash123","role":"student"}'
```

GET `/users/:id`

```bash
curl http://localhost:3000/users/1
```

PUT `/users/:id`

```bash
curl -X PUT http://localhost:3000/users/1 -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com","password_hash":"newhash","role":"ta"}'
```

PATCH `/users/:id`

```bash
curl -X PATCH http://localhost:3000/users/1 -H "Content-Type: application/json" -d '{"role":"instructor"}'
```

DELETE `/users/:id`

```bash
curl -X DELETE http://localhost:3000/users/1
```

GET `/projects`

```bash
curl http://localhost:3000/projects
```

POST `/projects`

```bash
curl -X POST http://localhost:3000/projects -H "Content-Type: application/json" -d '{"name":"Checkpoint API","description":"Course checkpoint project","owner_id":1}'
```

- `owner_id` must be an existing user id.

GET `/projects/:id`

```bash
curl http://localhost:3000/projects/1
```

PUT `/projects/:id`

```bash
curl -X PUT http://localhost:3000/projects/1 -H "Content-Type: application/json" -d '{"name":"Checkpoint API","description":"Updated description","owner_id":1}'
```

PATCH `/projects/:id`

```bash
curl -X PATCH http://localhost:3000/projects/1 -H "Content-Type: application/json" -d '{"description":"Patched description"}'
```

DELETE `/projects/:id`

```bash
curl -X DELETE http://localhost:3000/projects/1
```

GET `/tasks`

```bash
curl http://localhost:3000/tasks
```

GET `/tasks?project_id=1`

```bash
curl http://localhost:3000/tasks?project_id=1
```

- `project_id` must be a positive integer query value.

POST `/tasks`

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Implement auth","description":"Add login endpoint","status":"todo","project_id":1,"assigned_to":1}'
```

- `project_id` is required.
- `assigned_to` is optional.

POST `/tasks` (unassigned)

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Write docs","project_id":1}'
```

GET `/tasks/:id`

```bash
curl http://localhost:3000/tasks/1
```

PUT `/tasks/:id`

```bash
curl -X PUT http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"title":"Implement auth","project_id":1}'
```

PATCH `/tasks/:id`

```bash
curl -X PATCH http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"assigned_to":2,"status":"in_progress"}'
```

DELETE `/tasks/:id`

```bash
curl -X DELETE http://localhost:3000/tasks/1
```

Relationship notes (current behavior)

- `projects.owner_id` must reference an existing user.
- `tasks.project_id` must reference an existing project.
- `tasks.assigned_to` is optional, but if provided it must reference an existing user.
