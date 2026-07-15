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

2. To view the browser page, first navigate to the client directory in the new terminal. From the project directory, run `cd apps/client`, enter `npm run client`, then in a browser visit `http://localhost:5173`.

## Testing

## Routes
