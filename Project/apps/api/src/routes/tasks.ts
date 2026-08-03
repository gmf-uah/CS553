import { Router, type RequestHandler } from "express";
import { validateId_Middleware, validateId_Raw } from "../middleware/validator";
import authenticateToken, {
    requireRole,
    toAuthenticatedUser,
} from "../middleware/authenticator";
import { pool } from "../services/pool";
import { ProjectService } from "../services/projectService";
import { TaskService, TaskValidationMode, validateTask } from "../services/taskService";
import {
    createDeleteHandler,
    createGetByIdHandler,
    createPatchHandler,
    createPostHandler,
    createPutHandler,
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

function parseProjectIdOrReject(
    rawProjectId: unknown,
    res: Parameters<RequestHandler>[1],
    options: { required: boolean },
): number | null {
    if (typeof rawProjectId === "undefined") {
        if (options.required) {
            res.status(400).json({ error: "project_id must be provided" });
            return null;
        }

        return null;
    }

    if (Array.isArray(rawProjectId)) {
        res
            .status(400)
            .json({ error: "project_id must be a single positive integer" });
        return null;
    }

    if (typeof rawProjectId !== "number" && typeof rawProjectId !== "string") {
        res.status(400).json({ error: "project_id must be a positive integer" });
        return null;
    }

    const { is_valid_id, numeric_id } = validateId_Raw(String(rawProjectId));
    if (!is_valid_id || numeric_id === null) {
        res.status(400).json({ error: "project_id must be a positive integer" });
        return null;
    }

    return numeric_id;
}

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

// If a task mutation references a project, verify that project before the write handler runs.
function loadProjectFromBody(required: boolean): RequestHandler {
    return async (req, res, next) => {
        const projectId = parseProjectIdOrReject(
            (req.body as Record<string, unknown>).project_id,
            res,
            { required },
        );

        if (projectId === null) {
            if (!required && typeof (req.body as Record<string, unknown>).project_id === "undefined") {
                res.locals.targetProject = null;
                next();
            }
            return;
        }

        try {
            const project = await projectService.getProjectById(projectId);
            if (!project) {
                return res
                    .status(404)
                    .json({ error: `Project not found with ID ${projectId}` });
            }

            res.locals.targetProject = project;
            next();
        } catch (error) {
            internalServerError(error, "Failed to fetch project", res);
        }
    };
}

function loadProjectIdFromQuery(required: boolean): RequestHandler {
    return (req, res, next) => {
        const projectId = parseProjectIdOrReject(req.query.project_id, res, {
            required,
        });

        if (projectId === null) {
            if (!required && typeof req.query.project_id === "undefined") {
                res.locals.projectId = undefined;
                next();
            }
            return;
        }

        res.locals.projectId = projectId;
        next();
    };
}

// Load joined ownership data once so task write routes can share the same authorization check.
const loadTaskAuthorizationContext: RequestHandler = async (_req, res, next) => {
    try {
        const context = await taskService.getTaskAuthorizationContext(res.locals.id);
        if (!context) {
            return res
                .status(404)
                .json({ error: `Task not found with ID ${res.locals.id}` });
        }

        res.locals.taskAuthorizationContext = context;
        next();
    } catch (error) {
        internalServerError(error, "Failed to fetch task authorization context", res);
    }
};

const requireTaskCreateAccess: RequestHandler = (req, res, next) => {
    const user = getAuthenticatedUserOrReject(res.locals.user, res);
    if (!user) {
        return;
    }

    const project = res.locals.targetProject as { ownerId: number } | null;
    if (!project) {
        return res.status(400).json({ error: "project_id must be provided" });
    }

    if (user.role === "admin" || project.ownerId === user.userId) {
        next();
        return;
    }

    return res.status(403).json({
        error: "You do not have permission to modify this task"
    });
};

const requireTaskManagementAccess: RequestHandler = (_req, res, next) => {
    const user = getAuthenticatedUserOrReject(res.locals.user, res);
    if (!user) {
        return;
    }

    // need to check if the user trying to change the task was assigned it
    // or if the user owns the project the task is under
    const context = res.locals.taskAuthorizationContext as {
        projectOwnerId: number;
        assignedTo: number | null;
    };
    const canManageTask =
        user.role === "admin" ||
        context.projectOwnerId === user.userId ||
        context.assignedTo === user.userId;

    if (canManageTask) {
        next();
        return;
    }

    return res.status(403).json({
        error: "You do not have permission to modify this task"
    });
};

// Normal users may only point task writes at projects they own; admins may target any project.
const requireTargetProjectAccess: RequestHandler = (_req, res, next) => {
    const user = getAuthenticatedUserOrReject(res.locals.user, res);
    if (!user) {
        return;
    }

    const project = res.locals.targetProject as { ownerId: number } | null;
    if (!project || user.role === "admin" || project.ownerId === user.userId) {
        next();
        return;
    }

    return res.status(403).json({
        error: "You do not have permission to modify this project"
    });
};

router.get("/", loadProjectIdFromQuery(false), async (_req, res) => {
    try {
        // if the project id query param isnt provided,
        // assume the user wants all tasks in the db, not just tasks for that project
        if (typeof res.locals.projectId === "undefined") {
            const tasks = await taskService.getAllTasks();
            return res.json(tasks);
        }

        const tasks = await taskService.getAllTasks(res.locals.projectId as number);
        res.json(tasks);
    } catch (error) {
        internalServerError(error, "Failed to fetch tasks", res);
    }
});

router.post(
    "/",
    validateTask(TaskValidationMode.CREATE_MINIMUM),
    loadProjectFromBody(true),
    requireTaskCreateAccess,
    createPostHandler((payload, fields) => taskService.createTask(payload, fields), {
        writeErrorMessage: "Failed to add task",
    }),
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
    // a whole bacon lettuce tomato sandwich of middleware
    validateTask(TaskValidationMode.CREATE_MINIMUM),
    loadTaskAuthorizationContext,
    requireTaskManagementAccess,
    loadProjectFromBody(true),
    requireTargetProjectAccess,
    createPutHandler({
        replacer: (id, payload, fields) => taskService.replaceTask(id, payload, fields),
        notFoundMessage: (id) => `Task not found with ID ${id}`,
        writeErrorMessage: "Failed to replace task",
    }),
);

router.patch(
    "/:id",
    validateTask(TaskValidationMode.UPDATE_PARTIAL),
    loadTaskAuthorizationContext,
    requireTaskManagementAccess,
    loadProjectFromBody(false),
    requireTargetProjectAccess,
    createPatchHandler({
        updater: (id, payload, fields) => taskService.updateTask(id, payload, fields),
        notFoundMessage: (id) => `Task not found with ID ${id}`,
        writeErrorMessage: "Failed to update task",
    }),
);

router.delete(
    "/:id",
    loadTaskAuthorizationContext,
    requireTaskManagementAccess,
    createDeleteHandler({
        deleter: (id) => taskService.deleteTask(id),
        notFoundMessage: (id) => `Task not found with ID ${id}`,
        writeErrorMessage: "Failed to delete task",
    }),
);

export default router;