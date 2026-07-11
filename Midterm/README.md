# Course Task Tracker

## Setup

1. In a terminal, navigate to the `Midterm` directory and run `npm install`.

2. Start the server with the command `npm run server`.

3. Once the server is running, the 'basic client program' can be run in a separate terminal with `npm run client`.

## curl (optional)

Alongside the automated client script, the server API can be interacted with via the following curl commands.

`GET` health
```bash
curl http://localhost:3000/health
```

`GET` all tasks
```bash
curl http://localhost:3000/tasks
```

`GET` a specific task
```bash
curl http://localhost:3000/tasks/1
```

`POST` new task
```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Homework 4","course":"MA 799","completed":true}'
```

`PUT` to replace an existing task
```bash
curl -X PUT http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"title":"Class dismissed","course":"CS 1000","completed":true}'
```

`PATCH` to update some fields of an existing task
```bash
curl -X PATCH http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"title":12, "course":"CS 788", "garbage":"nothing"}'
```

`DELETE` an existing task
```bash
curl -X DELETE http://localhost:3000/tasks/1
```