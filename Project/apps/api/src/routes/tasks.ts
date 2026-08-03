import { Router } from "express";
import { validateId_Middleware, validateId_Raw } from "../middleware/validator";
import authenticateToken, {
	requireRole,
	toAuthenticatedUser,
} from "../middleware/authenticator";
import { pool } from "../services/pool";
import { ProjectService } from "../services/projectService";
import { TaskService, TaskValidationMode, validateTask } from "../services/taskService";
import {
	createGetByIdHandler,
	handleDatabaseWriteError,
	internalServerError,
} from "../util";

const router = Router();
const taskService = new TaskService(pool);
const projectService = new ProjectService(pool);

router.use(authenticateToken);
router.use(requireRole("user", "admin"));

// now for some reason the router needs to establish the id validation
// it cant be placed in the chain of custody at one time in server.ts anymore
// this seems like a downside of route splitting
router.param("id", validateId_Middleware);

router.get("/", async (req, res) => {
	try {
		const rawProjectId = req.query.project_id;
		if (typeof rawProjectId === "undefined") {
			const tasks = await taskService.getAllTasks();
			return res.json(tasks);
		}

		if (Array.isArray(rawProjectId)) {
			return res
				.status(400)
				.json({ error: "project_id must be a single positive integer" });
		}

		const { is_valid_id, numeric_id: projectId } = validateId_Raw(String(rawProjectId));
		if (!is_valid_id || projectId === null) {
			return res
				.status(400)
				.json({ error: "project_id must be a positive integer" });
		}

		const tasks = await taskService.getAllTasks(projectId);
		res.json(tasks);
	} catch (error) {
		internalServerError(error, "Failed to fetch tasks", res);
	}
});

router.post(
	"/",
	validateTask(TaskValidationMode.CREATE_MINIMUM),
	async (req, res) => {
		const user = toAuthenticatedUser(res.locals.user);

		if (!user) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const payload = req.body as Record<string, unknown>;
		const projectId = payload.project_id;

		if (typeof projectId !== "number") {
			return res.status(400).json({ error: "project_id must be provided" });
		}

		try {
			const project = await projectService.getProjectById(projectId);
			if (!project) {
				return res
					.status(404)
					.json({ error: `Project not found with ID ${projectId}` });
			}

			if (user.role !== "admin" && project.ownerId !== user.userId) {
				return res.status(403).json({
					error: "Forbidden",
					message: "You can only create tasks in projects you own.",
				});
			}

			const created = await taskService.createTask(
				payload,
				res.locals.validFields as string[],
			);
			res.status(201).json(created);
		} catch (error) {
			handleDatabaseWriteError(error, res, "Failed to add task");
		}
	},
);

router.get(
	"/:id",
	createGetByIdHandler({
		action: (id) => taskService.getTaskById(id),
		notFoundMessage: (id) => `Task not found with ID ${id}`,
		actionErrorMessage: "Failed to fetch task",
	}),
);

router.put(
	"/:id",
	validateTask(TaskValidationMode.CREATE_MINIMUM),
	async (req, res) => {
		const user = toAuthenticatedUser(res.locals.user);

		if (!user) {
			return res.status(401).json({ error: "Authentication required" });
		}

		try {
			const context = await taskService.getTaskAuthorizationContext(res.locals.id);
			if (!context) {
				return res
					.status(404)
					.json({ error: `Task not found with ID ${res.locals.id}` });
			}

			const canManageTask =
				user.role === "admin" ||
				context.projectOwnerId === user.userId ||
				context.assignedTo === user.userId;
			if (!canManageTask) {
				return res.status(403).json({
					error: "Forbidden",
					message: "You can only modify tasks you own or are assigned to manage.",
				});
			}

			const payload = req.body as Record<string, unknown>;
			const incomingProjectId = payload.project_id;
			if (user.role !== "admin" && typeof incomingProjectId === "number") {
				const targetProject = await projectService.getProjectById(incomingProjectId);
				if (!targetProject) {
					return res
						.status(404)
						.json({ error: `Project not found with ID ${incomingProjectId}` });
				}

				if (targetProject.ownerId !== user.userId) {
					return res.status(403).json({
						error: "Forbidden",
						message: "You cannot move tasks to projects you do not own.",
					});
				}
			}

			const replaced = await taskService.replaceTask(
				res.locals.id,
				payload,
				res.locals.validFields as string[],
			);

			if (!replaced) {
				return res
					.status(404)
					.json({ error: `Task not found with ID ${res.locals.id}` });
			}

			res.json(replaced);
		} catch (error) {
			handleDatabaseWriteError(error, res, "Failed to replace task");
		}
	},
);

router.patch(
	"/:id",
	validateTask(TaskValidationMode.UPDATE_PARTIAL),
	async (req, res) => {
		const user = toAuthenticatedUser(res.locals.user);

		if (!user) {
			return res.status(401).json({ error: "Authentication required" });
		}

		try {
			const context = await taskService.getTaskAuthorizationContext(res.locals.id);
			if (!context) {
				return res
					.status(404)
					.json({ error: `Task not found with ID ${res.locals.id}` });
			}

			const canManageTask =
				user.role === "admin" ||
				context.projectOwnerId === user.userId ||
				context.assignedTo === user.userId;
			if (!canManageTask) {
				return res.status(403).json({
					error: "Forbidden",
					message: "You can only modify tasks you own or are assigned to manage.",
				});
			}

			const payload = req.body as Record<string, unknown>;
			const incomingProjectId = payload.project_id;
			if (user.role !== "admin" && typeof incomingProjectId === "number") {
				const targetProject = await projectService.getProjectById(incomingProjectId);
				if (!targetProject) {
					return res
						.status(404)
						.json({ error: `Project not found with ID ${incomingProjectId}` });
				}

				if (targetProject.ownerId !== user.userId) {
					return res.status(403).json({
						error: "Forbidden",
						message: "You cannot move tasks to projects you do not own.",
					});
				}
			}

			const updated = await taskService.updateTask(
				res.locals.id,
				payload,
				res.locals.validFields as string[],
			);

			if (!updated) {
				return res
					.status(404)
					.json({ error: `Task not found with ID ${res.locals.id}` });
			}

			res.json(updated);
		} catch (error) {
			handleDatabaseWriteError(error, res, "Failed to update task");
		}
	},
);

router.delete(
	"/:id",
	async (_req, res) => {
		const user = toAuthenticatedUser(res.locals.user);

		if (!user) {
			return res.status(401).json({ error: "Authentication required" });
		}

		try {
			const context = await taskService.getTaskAuthorizationContext(res.locals.id);
			if (!context) {
				return res
					.status(404)
					.json({ error: `Task not found with ID ${res.locals.id}` });
			}

			const canManageTask =
				user.role === "admin" ||
				context.projectOwnerId === user.userId ||
				context.assignedTo === user.userId;
			if (!canManageTask) {
				return res.status(403).json({
					error: "Forbidden",
					message: "You can only delete tasks you own or are assigned to manage.",
				});
			}

			const deleted = await taskService.deleteTask(res.locals.id);
			if (!deleted) {
				return res
					.status(404)
					.json({ error: `Task not found with ID ${res.locals.id}` });
			}

			res.status(204).end();
		} catch (error) {
			handleDatabaseWriteError(error, res, "Failed to delete task");
		}
	},
);

export default router;