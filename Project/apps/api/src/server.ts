import express from "express";
import { env } from "./config/env";

//originally, all my routes were named healthRegistration.ts, projectRegistration.ts, ...
// ... and I had an index file to gather and centrally export them.
// But the lecture on route splitting made it clear the correct CRUD pattern.
// Tasks is a resource, and the export from the tasks file ... 
// ... is the router to determine how to interact with that resource.
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import projectsRouter from "./routes/projects";
import tasksRouter from "./routes/tasks";
import usersRouter from "./routes/users";
import { bootstrapAdminUser } from "./services/adminBootstrapService";

let theApp: ReturnType<typeof createApp> | null = null;
let appInitPromise: Promise<ReturnType<typeof createApp>> | null = null;

export function createApp() {
	const app = express();
	app.use(express.json());
	// app.param("id", validateId);
	app.use(healthRouter);
	app.use("/auth", authRouter);
	app.use("/users", usersRouter);
	app.use("/projects", projectsRouter);
	app.use("/tasks", tasksRouter);

	// Canvas Checkpoint 1 Step 1 'Create the basic Express server'
	// Steps 2 and 3 'Connect to PostgreSQL', 'Create the tasks table' done via the Setup process in main README
	return app;
}

async function initializeApp(): Promise<ReturnType<typeof createApp>> {
	if (!theApp) {
		theApp = createApp();
	}

	await bootstrapAdminUser();
	return theApp;
}

export function getApp() {
	if (!appInitPromise) {
		appInitPromise = initializeApp();
	}

	return appInitPromise;
}

void getApp()
	.then((app) => {
		app.listen(env.port, () => {
			console.log(`Server running at http://localhost:${env.port}`);
		});
	})
	.catch((error) => {
		console.error("Failed to initialize app", error);
	});