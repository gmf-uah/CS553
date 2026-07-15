import express from "express";
import { env } from "./config/env";
import { pool } from "./db/pool";

const app = express();

app.use(express.json());

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
		console.error("Database health check failed:", error);
		res.status(500).json({
			status: "error",
			database: "disconnected",
		});
	}
});

// 4. 'Implement GET /tasks'
app.get("/tasks", async (_req, res) => {
	try {
		const result = await pool.query(
			`SELECT id,
                    title,
                    description,
                    status,
                    created_at AS "createdAt",
                    updated_at AS "updatedAt"
             FROM tasks
             ORDER BY id `,
		);

		res.json(result.rows);
	} catch (error) {
		console.error("Failed to fetch tasks:", error);
		res.status(500).json({
			status: "error",
			message: "Failed to fetch tasks",
		});
	}
});

// Canvas Checkpoint 1 Step 1 'Create the basic Express server'
app.listen(env.port, () => {
	console.log(`Server running at http://localhost:${env.port}`);
});

// Steps 2 and 3 'Connect to PostgreSQL', 'Create the tasks table' done via the Setup process in main README