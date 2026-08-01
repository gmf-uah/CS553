import express from "express";
import type { Application } from "express";
import type { Pool } from "pg";
import { pool } from "./db/pool";
import { env } from "./config/env";

import { validateId } from "./middleware/validator";
import { registerRoutes } from "./routes/index";

type RouteRegistrar = (app: Application, pool: Pool) => void;
// registering task routes vs. registering health routes
// they follow the same function signature, but we still separate concerns

export function createApp() {
	const app = express();
	app.use(express.json());
	app.param("id", validateId);
	registerRoutes.forEach((registerRoute: RouteRegistrar) => registerRoute(app, pool));

	// Canvas Checkpoint 1 Step 1 'Create the basic Express server'
	app.listen(env.port, () => {
		console.log(`Server running at http://localhost:${env.port}`);
	});

	// Steps 2 and 3 'Connect to PostgreSQL', 'Create the tasks table' done via the Setup process in main README
	return app;
}

createApp();