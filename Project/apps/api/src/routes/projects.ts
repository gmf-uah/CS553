import { Router } from "express";
import { validateId_Middleware } from "../middleware/validator";
import authenticateToken, {
	requireRole,
	toAuthenticatedUser,
} from "../middleware/authenticator";
import { pool } from "../services/pool";
import {
	ProjectService,
	ProjectValidationMode,
	validateProject,
} from "../services/projectService";
import {
	createGetByIdHandler,
	handleDatabaseWriteError,
	internalServerError,
} from "../util";

const router = Router();
const projectService = new ProjectService(pool);

router.use(authenticateToken);
router.use(requireRole("user", "admin"));

router.param("id", validateId_Middleware);

router.get("/", async (_req, res) => {
	try {
		const projects = await projectService.getAllProjects();
		res.json(projects);
	} catch (error) {
		internalServerError(error, "Failed to fetch projects", res);
	}
});

router.post(
	"/",
	validateProject(ProjectValidationMode.CREATE_MINIMUM),
	async (req, res) => {
		const user = toAuthenticatedUser(res.locals.user);

		if (!user) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const payload = req.body as Record<string, unknown>;
		const fields = [...(res.locals.validFields as string[])];

		if (user.role !== "admin") {
			if (fields.includes("owner_id") && payload.owner_id !== user.userId) {
				return res.status(403).json({
					error: "Forbidden",
					message: "Normal users can only create projects they own.",
				});
			}

			payload.owner_id = user.userId;
			if (!fields.includes("owner_id")) {
				fields.push("owner_id");
			}
		} else if (!fields.includes("owner_id")) {
			payload.owner_id = user.userId;
			fields.push("owner_id");
		}

		try {
			const created = await projectService.createProject(payload, fields);
			res.status(201).json(created);
		} catch (error) {
			handleDatabaseWriteError(error, res, "Failed to add project");
		}
	},
);

router.get(
	"/:id",
	createGetByIdHandler({
		action: (id) => projectService.getProjectById(id),
		notFoundMessage: (id) => `Project not found with ID ${id}`,
		actionErrorMessage: "Failed to fetch project",
	}),
);

router.put(
	"/:id",
	validateProject(ProjectValidationMode.CREATE_MINIMUM),
	async (req, res) => {
		const user = toAuthenticatedUser(res.locals.user);

		if (!user) {
			return res.status(401).json({ error: "Authentication required" });
		}

		try {
			const existing = await projectService.getProjectById(res.locals.id);

			if (!existing) {
				return res
					.status(404)
					.json({ error: `Project not found with ID ${res.locals.id}` });
			}

			if (user.role !== "admin" && existing.ownerId !== user.userId) {
				return res.status(403).json({
					error: "Forbidden",
					message: "You can only modify projects you own.",
				});
			}

			const payload = req.body as Record<string, unknown>;
			const fields = [...(res.locals.validFields as string[])];

			if (user.role !== "admin" && fields.includes("owner_id")) {
				return res.status(403).json({
					error: "Forbidden",
					message: "Only admins can change project ownership.",
				});
			}

			if (!fields.includes("owner_id")) {
				payload.owner_id = existing.ownerId;
				fields.push("owner_id");
			}

			const replaced = await projectService.replaceProject(
				res.locals.id,
				payload,
				fields,
			);

			if (!replaced) {
				return res
					.status(404)
					.json({ error: `Project not found with ID ${res.locals.id}` });
			}

			res.json(replaced);
		} catch (error) {
			handleDatabaseWriteError(error, res, "Failed to replace project");
		}
	},
);

router.patch(
	"/:id",
	validateProject(ProjectValidationMode.UPDATE_PARTIAL),
	async (req, res) => {
		const user = toAuthenticatedUser(res.locals.user);

		if (!user) {
			return res.status(401).json({ error: "Authentication required" });
		}

		try {
			const existing = await projectService.getProjectById(res.locals.id);

			if (!existing) {
				return res
					.status(404)
					.json({ error: `Project not found with ID ${res.locals.id}` });
			}

			if (user.role !== "admin" && existing.ownerId !== user.userId) {
				return res.status(403).json({
					error: "Forbidden",
					message: "You can only modify projects you own.",
				});
			}

			const fields = res.locals.validFields as string[];
			if (user.role !== "admin" && fields.includes("owner_id")) {
				return res.status(403).json({
					error: "Forbidden",
					message: "Only admins can change project ownership.",
				});
			}

			const updated = await projectService.updateProject(
				res.locals.id,
				req.body as Record<string, unknown>,
				fields,
			);

			if (!updated) {
				return res
					.status(404)
					.json({ error: `Project not found with ID ${res.locals.id}` });
			}

			res.json(updated);
		} catch (error) {
			handleDatabaseWriteError(error, res, "Failed to update project");
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
			const existing = await projectService.getProjectById(res.locals.id);

			if (!existing) {
				return res
					.status(404)
					.json({ error: `Project not found with ID ${res.locals.id}` });
			}

			if (user.role !== "admin" && existing.ownerId !== user.userId) {
				return res.status(403).json({
					error: "Forbidden",
					message: "You can only delete projects you own.",
				});
			}

			const deleted = await projectService.deleteProject(res.locals.id);
			if (!deleted) {
				return res
					.status(404)
					.json({ error: `Project not found with ID ${res.locals.id}` });
			}

			res.status(204).end();
		} catch (error) {
			handleDatabaseWriteError(error, res, "Failed to delete project");
		}
	},
);

export default router;