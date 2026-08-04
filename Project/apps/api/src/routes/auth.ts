import { Router } from "express";
import { AuthService } from "../services/authService";
import { pool } from "../services/pool";
import { isNonEmptyString, handleDatabaseWriteError, internalServerError } from "../util";

const router = Router();
const authService = new AuthService(pool);

//password is being sent in plaintext
// subject to man in the middle attacks
// but this is not https
//we havent made it that far yet. Maybe that's a 454 line item
router.post("/register", async (req, res) => {
    // 3 minimum fields required for registration
	const { name, email, password } = req.body as Record<string, unknown>;
    // request body is json with string keys and multiple possible types of values

	if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
		return res.status(400).json({
			error: "name, email, and password are required and must be non-empty strings.",
		});
	}

	try {
		const user = await authService.registerUser({ // create new database user
			name: name.trim(),
			email: email.trim().toLowerCase(), // not case sensitive
			password,
		});

		res.status(201).json(user); // user has been created
	} catch (error) {
		if (error instanceof Error && error.message === "Email already exists.") {
			return res.status(409).json({ error: "Email already exists." });
		}

		handleDatabaseWriteError(error, res, "Failed to register user");
	}
});

router.post("/login", async (req, res) => {
	const { email, password } = req.body as Record<string, unknown>;

    // copy pasted some stuff from registration
	if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
		return res.status(400).json({
			error: "email and password are required and must be non-empty strings.",
		});
	}

	try {
		const token = await authService.loginUser({ // verify with user data from database
			email: email.trim().toLowerCase(),
			password,
		});

		if (!token) {
			return res.status(401).json({ error: "Invalid email or password." });
		}

		res.json({ token }); // return the valid token back to the user (http 200)
	} catch (error) {
		internalServerError(error, "Failed to log in user", res);
	}
});

export default router;