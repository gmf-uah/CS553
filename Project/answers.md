# Reflection

1. What is the difference between an in-memory API and a database-backed API?

    In-memory APIs store data that lasts until the server is shut down, while database-backed APIs ensure data persists across server restarts.

2. Why is it useful to separate routes, services, and database logic?

    DRY (Don't Repeat Yourself). If database logic isn't separated from task update logic, then when users are introduced and require database interaction, there is going to be a lot of redundant code for querying the database between the task and user functions.

    Separating service and database logic from routes allows the `server.ts` file (holding the routes) to be less cluttered. Also, where `validator.ts` defines validation functions for request body input, both `server.ts` and `taskService.ts` can use the shared code rather than copying it.

3. What HTTP status codes did you use, and why?

    | Status Code | Reason |
    | ----------- | ------ |
    | 200 | Successful GET, PUT, PATCH requests |
    | 201 | Successful POST requests (created new task) |
    | 204 | Successful DELETE requests |
    | 400 | Bad request; type mismatch (for example, sending a number as the task title) |
    | 404 | Task ID not found |
    | 500 | Database error (PostgreSQL not running for example) |

4. What happens when a client requests a task ID that does not exist?

    As in reflection question 3, the server will emit a 404 error. This occurs only after a database query that returned null, however.

5. What was the hardest part of connecting the API to PostgreSQL?

    The initial setup of creating the tasks table with that `psql` command took me for a loop. The `./database/README.md` file reads

    > Run `psql postgresql://postgres:postgres@localhost:5432/cs453 -f database/schema.sql`

    This implies you need to install `psql` itself, rather than running it through docker. Doing this covered up the docker port, so I had to stop the service and find a way to run that command through docker, and that command's execution depends on the terminal. That's how step 4 from the first time setup came to be.