# Example 04b — Basic API Client

This example shows a very small browser client that calls a REST API using
`fetch`.

This is not a React, Angular, Vue, or Svelte example. The goal is to show the
client/server boundary as clearly as possible.

The example demonstrates:

- a browser page as an API client
- `fetch` for GET and POST requests
- JSON request and response bodies
- status-code-aware error handling
- CORS configuration on the server

## Install

```bash
npm install
```

## Run the API server

In one terminal:

```bash
npm run api
```

The API runs on:

```text
http://localhost:3000
```

## Run the browser client

In a second terminal:

```bash
npm run client
```

Open:

```text
http://localhost:5173
```

## Why two ports?

The API server and browser client are intentionally served from different ports:

```text
API:    http://localhost:3000
Client: http://localhost:5173
```

That makes this a cross-origin browser request. The API server uses CORS so the
browser is allowed to read the response.

Use either http://localhost:5173 or http://127.0.0.1:5173 consistently.

For CORS, localhost and 127.0.0.1 are not the same origin.

## Main lesson

A browser client is not just curl with buttons. The browser enforces security
rules such as the same-origin policy. When the browser client and API server are
on different origins, the API must explicitly allow the browser origin with CORS.
