# Task Tracker

## First-Time Setup

1. In a terminal, navigate (`cd`) to the project directory. Once there, the current working directory should contain this `README.md` file along with files such as `docker-compose.yml`, `package.json`, and `.gitignore`.

2. With `Node.js` installed, run `npm install` to ensure all project dependencies are available.

3. Create the database with `npm run db:start`.

4. Run the following command to create the `tasks` table within the database.

    - In `bash`:

        ```bash
        docker exec -i cs453-postgres psql -U postgres -d cs453 -f - < database/schema.sql
        ```

    - In `PowerShell` (Windows):

        ```shell
        Get-Content database/schema.sql | docker exec -i cs453-postgres psql -U postgres -d cs453
        ```

## Run the Program

1. In the main project directory containing this README file, run the API server with `npm run dev`.

    In a separate terminal, observe that `curl` commands work, e.g. `curl http://localhost:3000/db-health`.

2. Browser page does not exist yet. Client interactions can only occur via `curl` for now. ~~To view the browser page, first navigate to the client directory in the new terminal. From the project directory, run `cd apps/client`, enter `npm run client`, then in a browser visit `http://localhost:5173`.~~

## Testing

The test script can be run with `npm run test`.

Please ensure you have an empty database before running the test script.

If you want to empty the database, run the following commands:

1.

```shell
npm run db:reset; npm run db:start
```

2. Repeat [Setup Step 4](#first-time-setup)

## Routes and Validation

**ID**: Check if ID is valid and exists in database

**Schema**: Check if the task schema is valid (has all required fields, type checks pass)

| Route | Validation |
| ----- | ---------- |
| GET `/health` | N/A |
| GET `/db-health` | N/A |
| GET `/tasks` | N/A |
| GET `/tasks/:id` | **ID** |
| POST `/tasks` | **Schema** |
| PUT `/tasks/:id` | **ID**, **Schema** |
| PATCH `/tasks/:id` | **ID**, **Schema** (Partial)* |
| DELETE `/tasks/:id` | **ID** |

\* The PATCH route only ensures that at least one of the updatable fields is present, and that there are no invalid fields (type mismatch)

## curl commands for routes, functionality, more notes on validation

GET `/health`

```bash
curl http://localhost:3000/health
```

- Checks if the server is running.

GET `/db-health`

```bash
curl http://localhost:3000/health
```

- Fails when the database fails. This is true for all routes on this server other than `GET /health`.

GET `/tasks`

```bash
curl http://localhost:3000/tasks
```

- Responds with an array of all tasks on the database.

GET `/tasks/:id`

```bash
curl http://localhost:3000/tasks/4
```

- Responds with the requested task from the database.
- Fails (404) if the ID is invalid, as with all other routes.

POST `/tasks`

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title": "test"}'
```

- Creates the requested task on the database.
- Fails (400) if task schema does not match, as with all other request body routes. All fields must be present and have matching types.

Invalid POST usage:

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"description": "hard task"}'
```

- Not all required fields are present here; the `title` field is missing.

PUT `/tasks/:id`

```bash
curl -X PUT http://localhost:3000/tasks/4 -H "Content-Type: application/json" -d '{"title":"exam"}'
```

- Replaces the requested task on the database.

Also valid:

```bash
curl -X PUT http://localhost:3000/tasks/4 -H "Content-Type: application/json" -d '{"title": "exam", "course": "CS 453"}'
```

- Extraneous fields are ignored; `"course": "CS 453"` does not cause an error nor does it affect the database.

PATCH `/tasks/:id`

```bash
curl -X PATCH http://localhost:3000/tasks/4 -H "Content-Type: application/json" -d '{"description": "very hard task"}'
```

- Updates the requested task with the provided fields. In this case, only the quantity field gets updated.

Invalid PATCH usage:

```bash
curl -X PATCH http://localhost:3000/tasks/4 -H "Content-Type: application/json" -d '{"description": 13, "title": "quiz"}'
```

- Fails because `"description"` is not a string. `"title"` is ignored because the request is rejected.

DELETE `/tasks/:id`

```bash
curl -X DELETE http://localhost:3000/tasks/4
```

- Deletes the task with id 4.