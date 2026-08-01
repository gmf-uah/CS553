import type { Application, Response } from "express";
import { Pool } from "pg";
import {
	TaskService,
	TaskValidationMode,
	validateTask,
} from "../services/taskService";
import { internalServerError } from "../util"

function taskNotFound(id: number, res: Response) {
	return res.status(404).json({ error: `Task not found with ID ${id}` });
}

export function registerTaskRoutes(app: Application, pool: Pool) {
	const taskService = new TaskService(pool);

	app.get("/health", (_req, res) => {
		res.json({
			status: "ok",
			service: "cs453-api",
		});
	});

	app.get("/db-health", async (_req, res) => {
		try {
			const result = await pool.query("SELECT NOW() AS current_time");
			res.json({
				status: "ok",
				database: "connected",
				currentTime: result.rows[0].current_time,
			});
		} catch (error) {
			internalServerError(error, "Database health check failed", res);
		}
	});

	app.get("/tasks", async (_req, res) => {
		try {
			const tasks = await taskService.getAllTasks();
			res.json(tasks);
		} catch (error) {
			internalServerError(error, "Failed to fetch tasks", res);
		}
	});

	app.post(
		"/tasks",
		validateTask(TaskValidationMode.CREATE_MINIMUM),
		async (req, res) => {
			try {
				// It looks like we're just sending the request body to the database raw here
				// but in reality, 2 things are going on here for safety, so rest assured no SQL injection
				// 1. validateTask is called before this route anon function is called
				// 2. createTask only accepts valid fields from the request body, hence the second argument.
				const task = await taskService.createTask(
					req.body,
					res.locals.validFields,
				);
				res.status(201).json(task);
			} catch (error) {
				internalServerError(error, "Failed to add task", res);
			}
		},
	);

	app.get("/tasks/:id", async (_req, res) => {
		try {
			const task = await taskService.getTaskById(res.locals.id);
			if (task) {
				res.json(task);
			} else {
				taskNotFound(res.locals.id, res);
			}
		} catch (error) {
			internalServerError(error, "Failed to fetch task", res);
		}
	});

	app.put(
		"/tasks/:id",
		validateTask(TaskValidationMode.CREATE_MINIMUM),
		async (req, res) => {
			try {
				const task = await taskService.replaceTask(
					res.locals.id,
					req.body,
					res.locals.validFields,
				);
				if (task) {
					res.json(task);
				} else {
					taskNotFound(res.locals.id, res);
				}
			} catch (error) {
				internalServerError(error, "Failed to replace task", res);
			}
		},
	);

	app.patch(
		"/tasks/:id",
		validateTask(TaskValidationMode.UPDATE_PARTIAL),
		async (req, res) => {
			try {
				// 1. identify the id the user wishes to update
				// 2. get the request body for what data the user is updating
				// 3. only allow the user to update fields that the server evaluated as valid
				// ignore extraneous fields sent by the user; reject the request outright if there is a type mismatch
				const task = await taskService.updateTask(
					res.locals.id,
					req.body,
					res.locals.validFields,
				);
				if (task) {
					res.json(task);
				} else {
					taskNotFound(res.locals.id, res);
				}
			} catch (error) {
				internalServerError(error, "Failed to update task", res);
			}
		},
	);

	app.delete("/tasks/:id", async (_req, res) => {
		try {
			const deleted = await taskService.deleteTask(res.locals.id);
			if (deleted) {
				res.status(204).end();
			} else {
				taskNotFound(res.locals.id, res);
			}
		} catch (error) {
			internalServerError(error, "Failed to delete task", res);
		}
	});
}