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
	app.listen(env.port, () => {
		console.log(`Server running at http://localhost:${env.port}`);
	});

	// Steps 2 and 3 'Connect to PostgreSQL', 'Create the tasks table' done via the Setup process in main README
	return app;
}

createApp();