import express from "express";
import cors from "cors";
import { logger } from "./middleware/logger.js";
import { validator } from "./middleware/validator.js";
import e from "express";

const app = express();
const port = 3000;

app.use(cors()); // this lets me use the OpenAPI VS Code extension to test the API endpoints via a GUI panel
app.use(express.json());
app.use(logger);

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// only tasks endpoint where no validation is required, as there is no id nor request body
// but we use it anyway because the validator script has access to the tasks table
app.get("/tasks", validator, (req, res) => {
    res.json({ tasks: req.tasks });
});

// originally, all paths from hereon were processed through validation middleware
// however, we need to validate id's, and this syntax doesn't send req.params.id to validator.
// we must explicitly send validator as first callback in pipeline when declaring `:id` for each method
// ugly copy-pasting, but the other solution was uglier - manually scrape the id from the end of the URI
// app.use(validator);

// It's supposed to be "A validation middleware for creating or updating tasks."
// But I included this GET method in the validation middleware.
// Reason being that we need to verify the id first, and middleware does that best
app.get("/tasks/:id", validator, (req, res) => {
    // console.log(req.task);
    res.json(req.task);
});

app.post("/tasks", validator, (req, res) => {
    res.status(201).json(req.task);
});

app.put("/tasks/:id", validator, (req, res) => {
    res.json(req.task)
})

app.patch("/tasks/:id", validator, (req, res) => {
    res.json(req.task)
})

app.delete("/tasks/:id", validator, (req, res) => {
    res.status(204).end()// no response body
})

app.listen(port, () => {
    console.log(`Course Task Tracker API running on http://localhost:${port}`);
});