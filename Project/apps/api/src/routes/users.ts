import { Router } from "express";
import authenticateToken, { requireRole } from "../middleware/authenticator";
import { validateId_Middleware } from "../middleware/validator";

const router = Router(); // establish the middleware right up top for readers
router.use(authenticateToken);
router.use(requireRole("admin")); // only admins can interact with the `users` routes
router.param("id", validateId_Middleware);

import { pool } from "../services/pool";
import {
	USER_INPUT_SCHEMA,
	UserService,
	UserValidationMode,
	validateUser,
} from "../services/userService";
import {
	createDeleteHandler,
	createGetByIdHandler,
	createPatchHandler,
	createPostHandler,
	createPutHandler,
	internalServerError,
} from "../util";

const userService = new UserService(pool);

router.get("/", async (_req, res) => {
	try {
		const users = await userService.getAllUsers();
		res.json(users);
	} catch (error) {
		internalServerError(error, "Failed to fetch users", res);
	}
});

router.post(
	"/",
	validateUser(UserValidationMode.CREATE_MINIMUM, USER_INPUT_SCHEMA),
	createPostHandler((payload, fields) => userService.createUser(payload, fields), {
		writeErrorMessage: "Failed to add user",
	}),
);

router.get(
	"/:id",
	createGetByIdHandler({
		action: (id) => userService.getUserById(id),
		notFoundMessage: (id) => `User not found with ID ${id}`,
		actionErrorMessage: "Failed to fetch user",
	}),
);

router.put(
	"/:id",
	validateUser(UserValidationMode.CREATE_MINIMUM),
	createPutHandler({
		replacer: (id, payload, fields) => userService.replaceUser(id, payload, fields),
		notFoundMessage: (id) => `User not found with ID ${id}`,
		writeErrorMessage: "Failed to replace user",
	}),
);

router.patch(
	"/:id",
	validateUser(UserValidationMode.UPDATE_PARTIAL),
	createPatchHandler({
		updater: (id, payload, fields) => userService.updateUser(id, payload, fields),
		notFoundMessage: (id) => `User not found with ID ${id}`,
		writeErrorMessage: "Failed to update user",
	}),
);

router.delete(
	"/:id",
	createDeleteHandler({
		deleter: (id) => userService.deleteUser(id),
		notFoundMessage: (id) => `User not found with ID ${id}`,
		writeErrorMessage: "Failed to delete user",
	}),
);

export default router;