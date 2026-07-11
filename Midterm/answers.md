# Part 1 - Conceptual Foundations

## Sockets vs. HTTP

TCP is data in the form of a stream of bytes, designed to always be in order.

A TCP socket server listens for messages on a single port of a single IP address (like any socket), while HTTP servers build upon TCP servers by enforcing a structure of requests and responses. The HTTP server processes those requests and responses according to a set of standards, including status codes and API methods like GET, POST etc.

The standards HTTP provides are universal, rather than needing to be created per-project. This gets rid of potential overhead involved in locating where in a stream of bytes are the headers, query parameters, etc. (things that would need to be done on a raw TCP server). These standards mean less work for the developer in determining what makes a valid request.

## Request/Response

Request/response is a pattern of communication that is the basis for protocols like HTTP. Clients first send messages to a server, usually requesting or providing information. The server will then send back a response message to the client describing the nature of the success or failure of their request.

TCP doesn't enforce this communication pattern, as the server doesn't necessarily need to respond to a request with its own standalone response. HTTP is an implementation of the request/response pattern in the TCP protocol, but anyone could design their own protocol with this pattern on top of TCP.

An Express route handler softly enforces the request/response pattern. In Lab 3 when I deleted the `res.json()` call from any route, the server would remain functional, but that route would cause the client to hang (wait forever) when requested.

## Statelessness

HTTP as a protocol is designed to be stateless, meaning that any one incoming request is processed entirely on its own, rather than needing to await future messages to chain together a large request.

However, for an API to be stateless, it means there can be no semantic difference in program functionality when two requests are identical. This has a reliability advantage because the input-output mappings at testing time will always match the ones at production time.

For many APIs, though, having 'state' is required to produce useful data, such as a route for getting the total number of page visits. This route would likely be a GET request with no body, but repeated requests to a high-traffic server would respond with different values.

## HTTP Status Codes

| Situation | Status Code | Justification |
| --------- | ----------- | ------------- |
| A new resource was successfully created | 201 | Week 2 Slide 8; successful POST requests often create data. 200 level codes are for successful requests |
| The client requested an item that does not exist | 404 | Same slide; 400 level codes are for client errors. It wasn't that the server failed to find something that was there, but rather the client requested something that wasn't there |
| The client sent JSON missing a required field | 400 | Malformed request, whether bad JSON or incomplete response body. Usually for PUT, POST or other methods that typically use a response body |
| The server had an unexpected error | 500 | The client did everything right, but the server failed to process the request properly. Typical stand-in for database errors, as you dont want to tell the client there was a database issue, for security purposes
| A successful request returns JSON data | 200 | A GET request would do this, as 201 is typically for POST requests |

# Part 2 - API Design

I put two sections from this part into one table.

## Resource URIs and Method Semantics

| Request | URI | HTTP Method | Behavior (Safe, Idempotent, Neither) | Justification |
| ------- | --- | ----------- | ------------------------------------ | ------------- |
| Getting all tasks | /tasks | GET | Safe, Idempotent | A request is safe if it is read-only, which GET requests should be. All safe requests should be idempotent. |
| Getting one task by id | /tasks/{id} | GET | Safe, Idempotent | Ditto |
| Creating a task | /tasks | POST | Neither | Creating a new task writes new data each time it is done, which is neither read-only (safe) nor idempotent (having no effect beyond the first time) |
| Replacing a task | /tasks/{id} | PUT | Idempotent | Not safe because it is writing data, but it is idempotent because replacing a slot with item B over and over will always result in a slot with item B |
| Partially updating a task | /tasks/{id} | PATCH | Idempotent | Ditto, but only for specific fields of a task rather than the entire task itself. |
| Deleting a task | /tasks/{id} | DELETE | Idempotent | A task cannot be deleted more than once, so it is idempotent. No data is being 'written' (like from a request body), but the request changes the data stored, so it is not safe |

## JSON Representation

This is a curl command to create a new task with a POST request, using the JSON example provided in Part 2 of the midterm exam PDF. Note the absence of the `id` field, as the server fills that in.

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Watch Week 3 lecture", "course": "CS453", "completed": false}'
```

# Part 4 - Middleware

Briefly explain why these [2 middlewares] are middleware concerns instead of being repeated manually inside every route.

# Part 7 - Reflection

## Code vs. Contract

Explain the difference between an Express route implementation and an OpenAPI specification.

## Drift

Give two examples of how code and OpenAPI documentation can drift apart.

## Client Impact

Explain why inaccurate API documentation can cause problems for client developers.

# Part 8 - Graduate

## Option B — Contract-First Design

Explain the advantages and disadvantages of designing the OpenAPI specification before writing the Express code.

Your answer should discuss team communication, testing, client development, and the risk of implementation drift.
