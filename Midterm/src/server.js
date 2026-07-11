import express from "express";
import logger from "./middleware/logger.js";
import validator from "./middleware/validator.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(logger);
app.use(validator);

const tasks = [
    {
        "id": 1,
        "title": "Watch Week 3 lecture",
        "course": "CS453",
        "completed": false
    }
];
let nextId = tasks.length + 1;

app.get("/tasks", (req, res) => {
  res.json({ tasks });
});

app.post("/tasks", (req, res) => {
  const name = req.body?.name?.trim();

  if (!name) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Item name is required."
    });
  }

  const item = {
    id: nextId,
    name
  };

  nextId += 1;
  items.push(item);

  res.status(201).json({ item });
});

app.listen(port, () => {
  console.log(`Demo API running on http://localhost:${port}`);
});