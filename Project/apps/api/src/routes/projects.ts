import { Router, type RequestHandler } from "express";
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
	createDeleteHandler,
	createGetByIdHandler,
	createPatchHandler,
	createPostHandler,
	createPutHandler,
	internalServerError,
} from "../util";

const router = Router();
const projectService = new ProjectService(pool);

router.use(authenticateToken);
router.use(requireRole("user", "admin"));

router.param("id", validateId_Middleware);

function getAuthenticatedUserOrReject(
	userPayload: unknown,
	res: Parameters<RequestHandler>[1],
) {
	const user = toAuthenticatedUser(userPayload);
	if (!user) {
		res.status(401).json({ error: "Authentication required" });
		return null;
	}

	return user;
}

// Load the current project once so ownership checks and replace behavior can reuse it.
const loadProjectFromRouteId: RequestHandler = async (_req, res, next) => {
	try {
		const project = await projectService.getProjectById(res.locals.id);
		if (!project) {
			return res
				.status(404)
				.json({ error: `Project not found with ID ${res.locals.id}` });
		}

		res.locals.project = project;
		next();
	} catch (error) {
		internalServerError(error, "Failed to fetch project", res);
	}
};

const requireProjectOwnershipOrAdmin: RequestHandler = (_req, res, next) => {
	const user = getAuthenticatedUserOrReject(res.locals.user, res);
	if (!user) {
		return;
	}

	const project = res.locals.project as { ownerId: number };
	if (user.role === "admin" || project.ownerId === user.userId) {
		next();
		return;
	}

	return res.status(403).json({
		error: "You can only modify projects you own."
	});
};

// Normal users always create projects under their own ownership.
const prepareProjectCreatePayload: RequestHandler = (req, res, next) => {
	const user = getAuthenticatedUserOrReject(res.locals.user, res);
	if (!user) {
		return;
	}

	const payload = req.body as Record<string, unknown>;
	const fields = res.locals.validFields as string[];

	if (user.role !== "admin") {
		if (fields.includes("owner_id") && payload.owner_id !== user.userId) {
			return res.status(403).json({
				error: "Normal users can only create projects they own."
			});
		}

		payload.owner_id = user.userId;
		if (!fields.includes("owner_id")) {
			fields.push("owner_id");
		}
		next();
		return;
	}

	if (!fields.includes("owner_id")) {
		payload.owner_id = user.userId;
		fields.push("owner_id");
	}

	next();
};

const requireAdminToChangeProjectOwner: RequestHandler = (_req, res, next) => {
	const user = getAuthenticatedUserOrReject(res.locals.user, res);
	if (!user) {
		return;
	}

	const fields = res.locals.validFields as string[];
	if (user.role !== "admin" && fields.includes("owner_id")) {
		return res.status(403).json({
			error: "Only admins can change project ownership."
		});
	}

	next();
};

// PUT keeps the existing owner unless an admin explicitly changes it.
const preserveProjectOwnerOnReplace: RequestHandler = (req, res, next) => {
	const payload = req.body as Record<string, unknown>;
	const fields = res.locals.validFields as string[];
	const project = res.locals.project as { ownerId: number };

	if (!fields.includes("owner_id")) {
		payload.owner_id = project.ownerId;
		fields.push("owner_id");
	}

	next();
};

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
	prepareProjectCreatePayload,
	createPostHandler((payload, fields) => projectService.createProject(payload, fields), {
		writeErrorMessage: "Failed to add project",
	}),
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
	loadProjectFromRouteId,
	requireProjectOwnershipOrAdmin,
	requireAdminToChangeProjectOwner,
	preserveProjectOwnerOnReplace,
	createPutHandler({
		replacer: (id, payload, fields) =>
			projectService.replaceProject(id, payload, fields),
		notFoundMessage: (id) => `Project not found with ID ${id}`,
		writeErrorMessage: "Failed to replace project",
	}),
);

router.patch(
	"/:id",
	validateProject(ProjectValidationMode.UPDATE_PARTIAL),
	loadProjectFromRouteId,
	requireProjectOwnershipOrAdmin,
	requireAdminToChangeProjectOwner,
	createPatchHandler({
		updater: (id, payload, fields) =>
			projectService.updateProject(id, payload, fields),
		notFoundMessage: (id) => `Project not found with ID ${id}`,
		writeErrorMessage: "Failed to update project",
	}),
);

router.delete(
	"/:id",
	loadProjectFromRouteId,
	requireProjectOwnershipOrAdmin,
	createDeleteHandler({
		deleter: (id) => projectService.deleteProject(id),
		notFoundMessage: (id) => `Project not found with ID ${id}`,
		writeErrorMessage: "Failed to delete project",
	}),
);

export default router;