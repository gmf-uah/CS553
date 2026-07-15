# System Architecture 
## Week 2 Diagram
```mermaid
flowchart TD

    Client["Browser Client"]
    API["API Server"]
    PG["PostgresSQL (Docker)"]

    Client -->|HTTP / JSON| API
    API -->|SQL| PG
```

## Week 5 Diagram
```mermaid
flowchart TD

Client["Browser Client HTML / JavaScript"]

API["API Server TypeScript + Express"]

Auth["Authentication JWT / Login Service"]

PG["PostgresSQL (Docker)"]

Client -->|REST API| API

API --> Auth
API --> PG
```

## Week 7 Diagram
```mermaid
flowchart TD

Client["Browser Client HTML / JavaScript"]

API["API Server TypeScript + Express"]

Auth["Authentication JWT / Login Service"]

PG["PostgresSQL (Docker)"]

Realtime["WebSocket Server (Real-time Updates)"]

Client -->|REST API| API
Client -->|WebSockets| Realtime

API --> Auth
API --> PG
Realtime --> PG
```