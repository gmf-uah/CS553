# Part 1 - Conceptual Foundations

## Sockets vs. HTTP

TCP is data in the form of a stream of bytes, where each sequence of streams (messages) is designed to always be in order.

A TCP socket server listens for messages on a single port of a single IP address (like any socket). HTTP servers build upon TCP by enforcing a structure of requests and responses. The HTTP server processes those requests and responses according to a set of standards, including status codes and API methods like GET, POST etc.

The standards HTTP provides are universal, rather than needing to be created per-project. This gets rid of potential overhead involved in locating where in a stream of bytes are the headers, query parameters, etc. (things that would need to be done on a raw TCP server). These standards mean less work for the developer in determining what makes a valid request.

## Request/Response

Request/response is a pattern of communication that is the basis for protocols like HTTP. Clients first send messages to a server, usually requesting or providing information. The server will then send back a response message to the client describing the nature of the success or failure of their request.

TCP doesn't enforce this communication pattern, as the server doesn't necessarily need to respond to a a client following its request. HTTP is an implementation of the request/response pattern in the TCP protocol, but anyone could design their own protocol with this pattern on top of TCP.

An Express route handler softly enforces the request/response pattern. In Lab 3 when I deleted the `res.json()` call from any route, the server would remain functional, but that route would cause the client to hang (wait forever) when requested.

## Statelessness

HTTP as a protocol is designed to be stateless, meaning that any one incoming request is processed entirely on its own, rather than needing to await future messages to chain together a large request.

However, for an API to be stateless, it means there can be no semantic difference in program functionality when two requests are identical. This has a reliability advantage because the input-output mappings at testing time will always match the ones at production time.

For many APIs, though, having 'state' is required to produce useful behavior, such as a route for getting the total number of page visits. This route would likely be a GET request with no body, but repeated requests to a high-traffic server would respond with different values.

## HTTP Status Codes

| Situation | Status Code | Justification |
| --------- | ----------- | ------------- |
| A new resource was successfully created | 201 | Week 2 Slide 8; successful POST requests often create data. 200 level codes are for successful requests |
| The client requested an item that does not exist | 404 | Same slide; 400 level codes are for client errors. It wasn't that the server failed to find something that **was** there, but rather the client requested something that **wasn't** there |
| The client sent JSON missing a required field | 400 | Malformed request, whether bad JSON or incomplete request body. Usually for PUT, POST or other methods that typically use a request body |
| The server had an unexpected error | 500 | The client did everything right, but the server failed to process the request properly. Typical stand-in for database errors, as you dont want to tell the client there was a database issue, for security purposes (Week 5 Slide 28, "Important" note).
| A successful request returns JSON data | 200 | A GET request would do this, while POST requests typically return 201 |

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

A JSON body by itself doesn't create a new task, but if used as the request body of a POST request to the `/tasks` route, this is a valid JSON example taken from the midterm PDF page 2:

```js
{
    "title": "Watch Week 3 lecture","
    course": "CS453",
    "completed": false
}
```

Note the lack of `id` field, as this is assigned by the server, rather than sent by the client.

# Part 4 - Middleware

- Request logger

  - Well-suited for middleware because it is a generic functionality that prints output to the server after *any* request. It would be redundant to keep copying and pasting that functionality, or even just a function call, across every route.

  - It also is not the responsibility of the 'task creator' to be logging task creations. The route that creates tasks should only create tasks.

- Validation

  - I called my validation middleware 'validator'. Multiple routes check whether the request body is a valid task schema, or whether the id parameter matches that of any existing tasks.

  - Annoyingly, the id parameter isn't automatically passed to the middleware, so I have to declare the validator callback everywhere it is used. This does result in redundant copies of the name scattered across `server.js`.

# Part 7 - Reflection

## Code vs. Contract

OpenAPI specifications are user-facing blueprints that describe how each URI/route should respond to requests. It is also easily readable by machines, and so can allow extensions to generate a user-friendly page for developers to test API calls.

Express route implementations map routes to developer-written callback functions that attempt to abide by the OpenAPI blueprint. In many cases, the blueprint is written afterwards to fit the Express implementation; in any case, the OpenAPI specification and Express implementation should remain consistent.

## Drift

- OpenAPI spec and Express/javascript code may drift if uninitiated team members make behavioral changes to the code without making a corresponding change in the OpenAPI doc.

- Even if developers regularly update the spec to reflect code changes and vice versa, leaving certain constraints unchecked can cause further drift. For example, if the code does not enforce type checks on certain request body fields, then the code may allow behavior that is prohibited by the spec's strict type rules.

## Client Impact

Inaccurate API documentation, like an OpenAPI spec out of sync with its implementation, can cause unintended behavior and efficiency bottlenecks for client developers.

- A developer may be surprised to find that a certain API endpoint *never* works, and the ultimate reason is because the latest server release removed it entirely but the docs were never updated to reflect that change.

- There may also be an improved version of an API endpoint that is not documented. I have seen endpoints that just put the number 2 at the end, like "SortedList2" to get the second implementation of the "SortedList" endpoint. Client developers could then be using an old version that runs on less optimized, potentially higher latency code.

# Part 8 - Graduate

## Contract-First Design

Because OpenAPI specifications are relatively human-readable (like JSON or HTML), one advantage they provide is the ability for a wider audience to provide feedback, rather than just a few specialized engineers. Additionally, as with all markup languages, they are reducible to machine code and so can also be easily tested by that aforementioned wider audience through an API view like SwaggerUI.

~~An OpenAPI spec may provide an advantage that isn't obvious to the client developer, but is clear during the process of developing the API. If the API accepts a weird range of parameters, like a certain parameter~~

Explain the advantages and disadvantages of designing the OpenAPI specification before writing the Express code.

Your answer should discuss team communication, testing, client development, and the risk of implementation drift.
