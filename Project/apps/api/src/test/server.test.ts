import { describe, expect, test } from "vitest";
import request from "supertest";
import { createApp } from "../server"; // you dont do server.ts?

// not going to have this test file import from the service files
// therefore we cant import the signature, so just declare task as type any
function taskHasValidSignature(task: any): boolean {
    return  typeof task.title == "string" &&
            typeof task.status == "string" &&
            (typeof task.description == "string" || task.description == null) &&
            typeof task.createdAt == "string" &&
            typeof task.updatedAt == "string" &&
            typeof task.id == "number" &&
            Number.isInteger(task.id) &&
            task.id > 0
}

describe("Lab 3 starter", () => {
    test("GET /health returns status ok", async () => {
        const app = createApp();

        const response = await request(app)
            .get("/health")
            .expect(200);

        expect(response.body.status).toEqual("ok");
    });

    test("POST /tasks creates new task", async () => {
        const app = createApp();

        const response = await request(app)
            .post("/tasks")
            .send({ title: "CS 453", "description": "client server arch", "status": "in progress" })
            .expect(201);

        expect(taskHasValidSignature(response.body)).toBeTruthy();
    });

    test("POST /tasks rejects invalid task structure", async () => {
        const app = createApp();

        const response = await request(app)
            .post("/tasks")
            .send({ "title": 40 })
            .expect(400);

        expect(taskHasValidSignature(response.body)).toBeFalsy();
    });

    test("GET /tasks/:id can retrieve a task", async () => {
        const app = createApp();

        const response = await request(app)
            .get("/tasks/1")
            .expect(200);

        expect(taskHasValidSignature(response.body)).toBeTruthy();
    });

    test("POST /tasks creates another task", async () => {
        const app = createApp();

        const response = await request(app)
            .post("/tasks")
            .send({ title: "CS 424", "description": "programming languages", "status": "done" })
            .expect(201);

        expect(taskHasValidSignature(response.body)).toBeTruthy();
    });

    test("GET /tasks returns list of valid tasks", async () => {
        const app = createApp();

        const response = await request(app)
            .get("/tasks")
            .expect(200);

        let allTasksValid = true
        for (let task of response.body) {
            // console.log(item.id, typeof item.id, typeof item.id == "number")
            if (!taskHasValidSignature(task)) {
                // console.log("invalid")
                allTasksValid = false
                break
            }
        }
        // ensure all items have valid id, name, and quantity fields
        expect(allTasksValid).toBeTruthy()
    });

    test("PUT /tasks/:id replaces a task", async () => {
        const app = createApp();

        const response = await request(app)
            .put("/tasks/1")
            .send({ title: "CS 553" })
            .expect(200);
        // console.log("PUT response:", response.body, "PUT status:", response.status)

        // console.log("task Body:", response.body)
        expect(taskHasValidSignature(response.body)).toBeTruthy();
        expect(response.body.title).toEqual("CS 553");
        expect(response.body.description).toEqual(null);
    });

    test("PATCH /tasks/:id updates a task", async () => {
        const app = createApp();

        const newDesc = "client server arch grad level";
        const response = await request(app)
            .patch("/tasks/1")
            .send({ description: newDesc })
            .expect(200);
        // console.log("PUT response:", response.body, "PUT status:", response.status)

        expect(taskHasValidSignature(response.body)).toBeTruthy();
        expect(response.body.description).toEqual(newDesc);
    });
    
    test("DELETE /tasks/:id successfully deletes task", async () => {
        const app = createApp();

        const response = await request(app)
            .delete("/tasks/2")
            .expect(204);
    });

    test("DELETE /tasks/:id rejects task not found", async () => {
        const app = createApp();

        const response = await request(app)
            .delete("/tasks/2")
            .expect(404);

        expect(taskHasValidSignature(response.body)).toBeFalsy();
    });
});