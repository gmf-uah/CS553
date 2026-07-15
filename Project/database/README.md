# Database

This project uses PostgreSQL running in Docker.

## Setting up the database

```shell
docker compose up -d
or 
npm run db:start
```
Stop the database
```shell
docker compose down 
or 
npm run db:stop
```
Reset the database completely
```shell
docker compose down -v
or 
npm run db:reset
```
## Default connection settings
- Database: cs453 
- User: postgres 
- Password: postgres 
- Port: 5432

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cs453
```

## Creating tables

Run the schema file against the local database after PostgreSQL is running:

```shell
psql postgresql://postgres:postgres@localhost:5432/cs453 -f database/schema.sql
```
