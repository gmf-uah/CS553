import { Router } from "express";
import { pool } from "../services/pool";
import { internalServerError } from "../util";

const router = Router();

router.get("/health", (_req, res) => {
	res.json({
		status: "ok",
		service: "cs453-api",
	});
});

router.get("/db-health", async (_req, res) => {
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

export default router;