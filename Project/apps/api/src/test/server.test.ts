import { beforeAll, describe, expect, test } from "vitest";
import request from "supertest";
import { getApp } from "../server";

function authHeader(token: string) {
	return { Authorization: `Bearer ${token}` };
}

function publicUserHasValidSignature(user: any): boolean {
	return (
		typeof user.id === "number" &&
		Number.isInteger(user.id) &&
		user.id > 0 &&
		typeof user.name === "string" &&
		typeof user.email === "string" &&
		typeof user.role === "string" &&
		typeof user.createdAt === "string"
	);
}

function adminUserHasValidSignature(user: any): boolean {
	return (
		publicUserHasValidSignature(user) &&
		typeof user.passwordHash === "string" &&
		user.passwordHash.length > 0
	);
}

function projectHasValidSignature(project: any): boolean {
	return (
		typeof project.id === "number" &&
		Number.isInteger(project.id) &&
		project.id > 0 &&
		typeof project.name === "string" &&
		(typeof project.description === "string" || project.description === null) &&
		typeof project.ownerId === "number" &&
		Number.isInteger(project.ownerId) &&
		project.ownerId > 0 &&
		typeof project.createdAt === "string"
	);
}

function taskHasValidSignature(task: any): boolean {
	return (
		typeof task.id === "number" &&
		Number.isInteger(task.id) &&
		task.id > 0 &&
		typeof task.title === "string" &&
		typeof task.status === "string" &&
		(typeof task.description === "string" || task.description === null) &&
		typeof task.projectId === "number" &&
		Number.isInteger(task.projectId) &&
		task.projectId > 0 &&
		((typeof task.assignedTo === "number" && Number.isInteger(task.assignedTo) && task.assignedTo > 0) ||
			task.assignedTo === null) &&
		typeof task.createdAt === "string" &&
		typeof task.updatedAt === "string"
	);
}

function tokenHasValidSignature(token: unknown): boolean {
	return typeof token === "string" && token.split(".").length === 3;
}

const testRunId = Date.now().toString(36);
const adminEmail = "admin-email@example.com";
const adminPassword = "admin-password";
const bobEmail = `bob.${testRunId}@example.com`;
const bobPassword = `bob-password-${testRunId}`;
const charlieEmail = `charlie.${testRunId}@example.com`;
const charliePassword = `charlie-password-${testRunId}`;

let app: Awaited<ReturnType<typeof getApp>>;
let adminToken = "";
let adminId = 0;
let bobToken = "";
let bobId = 0;
let charlieToken = "";
let charlieId = 0;
let bobProject: any;
let charlieProject: any;
let adminProject: any;
let bobTask: any;
let adminTask: any;
let charlieTask: any;

function login(email: string, password: string) {
	return request(app).post("/auth/login").send({ email, password });
}

function createProject(token: string, body: Record<string, unknown>) {
	return request(app).post("/projects").set(authHeader(token)).send(body);
}

function createTask(token: string, body: Record<string, unknown>) {
	return request(app).post("/tasks").set(authHeader(token)).send(body);
}

describe("Tasks Manager", () => {
	beforeAll(async () => {
		app = await getApp();

        // create a bunch of state we can test on
		const adminLogin = await login(adminEmail, adminPassword).expect(200);
		adminToken = adminLogin.body.token;

		const bobRegister = await request(app)
			.post("/auth/register")
			.send({ name: "Bob", email: bobEmail, password: bobPassword })
			.expect(201);
		bobId = bobRegister.body.id;

		const charlieRegister = await request(app)
			.post("/auth/register")
			.send({ name: "Charlie", email: charlieEmail, password: charliePassword })
			.expect(201);
		charlieId = charlieRegister.body.id;

		const bobLogin = await login(bobEmail, bobPassword).expect(200);
		bobToken = bobLogin.body.token;

		const charlieLogin = await login(charlieEmail, charliePassword).expect(200);
		charlieToken = charlieLogin.body.token;

		const usersResponse = await request(app)
			.get("/users")
			.set(authHeader(adminToken))
			.expect(200);
		const adminUser = usersResponse.body.find(
			(user: any) => user.email === adminEmail,
		);
		adminId = adminUser.id;

		bobProject = (
			await createProject(bobToken, {
				name: `Bob project ${testRunId}`,
				description: "Owned by Bob",
			}).expect(201)
		).body;

		charlieProject = (
			await createProject(charlieToken, {
				name: `Charlie project ${testRunId}`,
				description: "Owned by Charlie",
			}).expect(201)
		).body;

		adminProject = (
			await createProject(adminToken, {
				name: `Admin project ${testRunId}`,
				description: "Owned by admin",
			}).expect(201)
		).body;

		bobTask = (
			await createTask(bobToken, {
				title: `Bob task ${testRunId}`,
				description: "Bob task fixture",
				status: "todo",
				project_id: bobProject.id,
				assigned_to: bobId,
			}).expect(201)
		).body;

		adminTask = (
			await createTask(adminToken, {
				title: `Admin task ${testRunId}`,
				description: "Admin task fixture",
				status: "in progress",
				project_id: adminProject.id,
				assigned_to: bobId,
			}).expect(201)
		).body;

		charlieTask = (
			await createTask(charlieToken, {
				title: `Charlie task ${testRunId}`,
				description: "Charlie task fixture",
				status: "todo",
				project_id: charlieProject.id,
				assigned_to: charlieId,
			}).expect(201)
		).body;
	});

	test("GET /health returns status ok (200)", async () => {
		const response = await request(app).get("/health").expect(200);

		expect(response.body.status).toEqual("ok");
	});

	test("GET /db-health returns status ok (200)", async () => {
		const response = await request(app).get("/db-health").expect(200);

		expect(response.body.status).toEqual("ok");
	});

	test("POST /auth/register rejects missing password (400)", async () => {
		const response = await request(app)
			.post("/auth/register")
			.send({ name: "No Password", email: `nopassword.${testRunId}@example.com` })
			.expect(400);

		expect(response.body.error).toContain("name, email, and password are required");
	});

	test("POST /auth/register creates a user (201)", async () => {
		const registerEmail = `register.${testRunId}@example.com`;
		const response = await request(app)
			.post("/auth/register")
			.send({
				name: `Register ${testRunId}`,
				email: registerEmail,
				password: `register-password-${testRunId}`,
			})
			.expect(201);

		expect(publicUserHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.email).toEqual(registerEmail);
		expect("passwordHash" in response.body).toBe(false);
	});

	test("POST /auth/register rejects duplicate emails (409)", async () => {
		const response = await request(app)
			.post("/auth/register")
			.send({
				name: "Duplicate Bob",
				email: bobEmail,
				password: bobPassword,
			})
			.expect(409);

		expect(response.body.error).toContain("already exists");
	});

	test("POST /auth/login rejects missing email or password (400)", async () => {
		const response = await request(app)
			.post("/auth/login")
			.send({ email: bobEmail })
			.expect(400);

		expect(response.body.error).toContain("email and password are required");
	});

	test("POST /auth/login rejects invalid credentials (401)", async () => {
		const response = await request(app)
			.post("/auth/login")
			.send({ email: bobEmail, password: `${bobPassword}-wrong` })
			.expect(401);

		expect(response.body.error).toEqual("Invalid email or password.");
	});

	test("POST /auth/login returns a token for a valid user (200)", async () => {
		const response = await login(charlieEmail, charliePassword).expect(200);

		expect(tokenHasValidSignature(response.body.token)).toBeTruthy();
	});

	test("GET /users rejects a normal user token (403)", async () => {
		const response = await request(app)
			.get("/users")
			.set(authHeader(bobToken))
			.expect(403);

		expect(response.body.message).toContain("admin");
	});

	test("GET /users returns full user records for admin (200)", async () => {
		const response = await request(app)
			.get("/users")
			.set(authHeader(adminToken))
			.expect(200);

        // response body is an array of users
		expect(Array.isArray(response.body)).toBeTruthy();
		expect(response.body.every(adminUserHasValidSignature)).toBeTruthy();
        // expect at least 1 of the array elements to have bob's email
		expect(response.body.some((user: any) => user.email === bobEmail)).toBeTruthy();
		expect(response.body.some((user: any) => user.email === charlieEmail)).toBeTruthy();
	});

	test("GET /users/:id returns a specific user for admin (200)", async () => {
		const response = await request(app)
			.get(`/users/${bobId}`)
			.set(authHeader(adminToken))
			.expect(200);

		expect(adminUserHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.email).toEqual(bobEmail);
	});

	test("GET /users/:id rejects invalid ids (400)", async () => {
		const response = await request(app)
			.get("/users/0")
			.set(authHeader(adminToken))
			.expect(400);

		expect(response.body.error).toEqual("ID must be a positive integer");
	});

	test("POST /users accepts password and logs the new user in (201)", async () => {
		const tempEmail = `admin-created.${testRunId}@example.com`;
		const tempPassword = `admin-created-password-${testRunId}`;

		const created = await request(app)
			.post("/users")
			.set(authHeader(adminToken))
			.send({
				name: "Admin Created",
				email: tempEmail,
				password: tempPassword,
				role: "user",
			})
			.expect(201);

		expect(adminUserHasValidSignature(created.body)).toBeTruthy();
		expect(created.body.email).toEqual(tempEmail);
		expect(typeof created.body.passwordHash).toBe("string");

		const loginResponse = await login(tempEmail, tempPassword).expect(200);
		expect(tokenHasValidSignature(loginResponse.body.token)).toBeTruthy();

		await request(app)
			.delete(`/users/${created.body.id}`)
			.set(authHeader(adminToken))
			.expect(204);
	});

	test("POST /users rejects invalid schema (400)", async () => {
		const response = await request(app)
			.post("/users")
			.set(authHeader(adminToken))
			.send({ name: "Missing Password", email: `missing-password.${testRunId}@example.com` })
			.expect(400);

		expect(response.body.error).toContain("Invalid user schema");
	});

	test("DELETE /users/:id deletes a disposable user (204)", async () => {
		const tempEmail = `delete-user.${testRunId}@example.com`;
		const tempPassword = `delete-user-password-${testRunId}`;

		const created = await request(app)
			.post("/users")
			.set(authHeader(adminToken))
			.send({
				name: "Delete Me",
				email: tempEmail,
				password: tempPassword,
				role: "user",
			})
			.expect(201);

		await request(app)
			.delete(`/users/${created.body.id}`)
			.set(authHeader(adminToken))
			.expect(204);

		const missing = await request(app)
			.get(`/users/${created.body.id}`)
			.set(authHeader(adminToken))
			.expect(404);

		expect(missing.body.error).toContain("User not found");
	});

	test("DELETE /users/:id can delete two newly created users sequentially as admin (204)", async () => {
		const firstEmail = `seq-delete-1.${testRunId}@example.com`;
		const secondEmail = `seq-delete-2.${testRunId}@example.com`;
		const firstPassword = `seq-delete-1-password-${testRunId}`;
		const secondPassword = `seq-delete-2-password-${testRunId}`;

		const firstUser = await request(app)
			.post("/users")
			.set(authHeader(adminToken))
			.send({
				name: "Sequential Delete One",
				email: firstEmail,
				password: firstPassword,
				role: "user",
			})
			.expect(201);

		const secondUser = await request(app)
			.post("/users")
			.set(authHeader(adminToken))
			.send({
				name: "Sequential Delete Two",
				email: secondEmail,
				password: secondPassword,
				role: "user",
			})
			.expect(201);

		await request(app)
			.delete(`/users/${firstUser.body.id}`)
			.set(authHeader(adminToken))
			.expect(204);

		await request(app)
			.delete(`/users/${secondUser.body.id}`)
			.set(authHeader(adminToken))
			.expect(204);

		await request(app)
			.get(`/users/${firstUser.body.id}`)
			.set(authHeader(adminToken))
			.expect(404);

		await request(app)
			.get(`/users/${secondUser.body.id}`)
			.set(authHeader(adminToken))
			.expect(404);
	});

	test("POST /projects creates a project for a normal user (201)", async () => {
		const response = await createProject(bobToken, {
			name: `Bob project ${testRunId} extra`,
			description: "Created by Bob",
		}).expect(201);

		expect(projectHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.ownerId).toEqual(bobId);
	});

	test("POST /projects rejects a normal user trying to set another owner (403)", async () => {
		const response = await createProject(bobToken, {
			name: `Bob forbidden project ${testRunId}`,
			description: "Should be rejected",
			owner_id: charlieId,
		}).expect(403);

		expect(response.body.message).toContain("Normal users can only create projects they own.");
	});

	test("POST /projects allows admin to create a project for another user (201)", async () => {
		const response = await createProject(adminToken, {
			name: `Admin project for Bob ${testRunId}`,
			description: "Created by admin for Bob",
			owner_id: bobId,
		}).expect(201);

		expect(projectHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.ownerId).toEqual(bobId);
	});

	test("GET /projects returns valid project records (200)", async () => {
		const response = await request(app)
			.get("/projects")
			.set(authHeader(bobToken))
			.expect(200);

		expect(Array.isArray(response.body)).toBeTruthy();
		expect(response.body.every(projectHasValidSignature)).toBeTruthy();
		expect(response.body.some((project: any) => project.id === bobProject.id)).toBeTruthy();
	});

	test("GET /projects/:id returns a project (200)", async () => {
		const response = await request(app)
			.get(`/projects/${bobProject.id}`)
			.set(authHeader(charlieToken))
			.expect(200);

		expect(projectHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.id).toEqual(bobProject.id);
	});

	test("GET /projects/:id rejects invalid ids (400)", async () => {
		const response = await request(app)
			.get("/projects/0")
			.set(authHeader(adminToken))
			.expect(400);

		expect(response.body.error).toEqual("ID must be a positive integer");
	});

	test("PUT /projects/:id replaces a project and preserves ownership (200)", async () => {
		const replacedProjectName = `Replaced project ${testRunId}`;
		const tempProject = (
			await createProject(bobToken, {
				name: `Replace project ${testRunId}`,
				description: "Before replace",
			}).expect(201)
		).body;

		const response = await request(app)
			.put(`/projects/${tempProject.id}`)
			.set(authHeader(bobToken))
			.send({ name: replacedProjectName })
			.expect(200);

		expect(projectHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.name).toEqual(replacedProjectName);
		expect(response.body.ownerId).toEqual(bobId);
		expect(response.body.description).toBeNull();
	});

	test("PATCH /projects/:id updates a project description (200)", async () => {
		const updatedDescription = "After patch";
		const tempProject = (
			await createProject(bobToken, {
				name: `Patch project ${testRunId}`,
				description: "Before patch",
			}).expect(201)
		).body;

		const response = await request(app)
			.patch(`/projects/${tempProject.id}`)
			.set(authHeader(bobToken))
			.send({ description: updatedDescription })
			.expect(200);

		expect(projectHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.description).toEqual(updatedDescription);
	});

	test("PATCH /projects/:id rejects owner changes for normal users (403)", async () => {
		const tempProject = (
			await createProject(bobToken, {
				name: `Owner change project ${testRunId}`,
				description: "Before owner change",
			}).expect(201)
		).body;

		const response = await request(app)
			.patch(`/projects/${tempProject.id}`)
			.set(authHeader(bobToken))
			.send({ owner_id: charlieId })
			.expect(403);

		expect(response.body.message).toContain("Only admins can change project ownership.");
	});

	test("PATCH /projects/:id rejects another user's project (403)", async () => {
		const disallowedDescription = "Not allowed";
		const response = await request(app)
			.patch(`/projects/${charlieProject.id}`)
			.set(authHeader(bobToken))
			.send({ description: disallowedDescription })
			.expect(403);

		expect(response.body.message).toContain("You can only modify projects you own.");
	});

	test("DELETE /projects/:id deletes an owned project (204)", async () => {
		const tempProject = (
			await createProject(bobToken, {
				name: `Delete project ${testRunId}`,
				description: "Before delete",
			}).expect(201)
		).body;

		await request(app)
			.delete(`/projects/${tempProject.id}`)
			.set(authHeader(bobToken))
			.expect(204);

		await request(app)
			.get(`/projects/${tempProject.id}`)
			.set(authHeader(bobToken))
			.expect(404);
	});

	test("DELETE /projects/:id rejects another user's project (403)", async () => {
		const response = await request(app)
			.delete(`/projects/${charlieProject.id}`)
			.set(authHeader(bobToken))
			.expect(403);

		expect(response.body.message).toContain("You can only modify projects you own.");
	});

	test("POST /tasks creates a task for a project owner (201)", async () => {
		const tempTask = await createTask(bobToken, {
			title: `Bob extra task ${testRunId}`,
			description: "Created by Bob",
			status: "todo",
			project_id: bobProject.id,
			assigned_to: bobId,
		}).expect(201);

		expect(taskHasValidSignature(tempTask.body)).toBeTruthy();
		expect(tempTask.body.projectId).toEqual(bobProject.id);
	});

	test("POST /tasks rejects a normal user on another user's project (403)", async () => {
		const response = await createTask(bobToken, {
			title: `Forbidden task ${testRunId}`,
			description: "Should be rejected",
			status: "todo",
			project_id: charlieProject.id,
			assigned_to: bobId,
		}).expect(403);

		expect(response.body.error).toEqual("You do not have permission to modify this task");
	});

	test("POST /tasks allows admin to create a task on any project (201)", async () => {
		const response = await createTask(adminToken, {
			title: `Admin task on Charlie ${testRunId}`,
			description: "Created by admin",
			status: "todo",
			project_id: charlieProject.id,
			assigned_to: charlieId,
		}).expect(201);

		expect(taskHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.projectId).toEqual(charlieProject.id);
	});

	test("GET /tasks returns valid task records (200)", async () => {
		const response = await request(app)
			.get("/tasks")
			.set(authHeader(bobToken))
			.expect(200);

		expect(Array.isArray(response.body)).toBeTruthy();
		expect(response.body.every(taskHasValidSignature)).toBeTruthy();
		expect(response.body.some((task: any) => task.id === bobTask.id)).toBeTruthy();
	});

	test("GET /tasks?project_id filters tasks by project (200)", async () => {
		const response = await request(app)
			.get(`/tasks?project_id=${bobProject.id}`)
			.set(authHeader(adminToken))
			.expect(200);

		expect(Array.isArray(response.body)).toBeTruthy();
		expect(response.body.every((task: any) => task.projectId === bobProject.id)).toBeTruthy();
	});

	test("GET /tasks/:id returns a task (200)", async () => {
		const response = await request(app)
			.get(`/tasks/${bobTask.id}`)
			.set(authHeader(charlieToken))
			.expect(200);

		expect(taskHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.id).toEqual(bobTask.id);
	});

	test("GET /tasks/:id rejects invalid ids (400)", async () => {
		const response = await request(app)
			.get("/tasks/0")
			.set(authHeader(adminToken))
			.expect(400);

		expect(response.body.error).toEqual("ID must be a positive integer");
	});

	test("PUT /tasks/:id replaces a task owned by the project owner (200)", async () => {
		const replacedTaskTitle = `Replaced task ${testRunId}`;
		const tempTask = (
			await createTask(bobToken, {
				title: `Replace task ${testRunId}`,
				description: "Before replace",
				status: "in progress",
				project_id: bobProject.id,
				assigned_to: bobId,
			}).expect(201)
		).body;

		const response = await request(app)
			.put(`/tasks/${tempTask.id}`)
			.set(authHeader(bobToken))
			.send({ title: replacedTaskTitle, project_id: bobProject.id })
			.expect(200);

		expect(taskHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.title).toEqual(replacedTaskTitle);
		expect(response.body.projectId).toEqual(bobProject.id);
		expect(response.body.description).toBeNull();
		expect(response.body.status).toEqual("todo");
		expect(response.body.assignedTo).toBeNull();
	});

	test("PATCH /tasks/:id updates a task for its assignee (200)", async () => {
		const updatedDescription = "Updated by assignee";
		const response = await request(app)
			.patch(`/tasks/${adminTask.id}`)
			.set(authHeader(bobToken))
			.send({ description: updatedDescription })
			.expect(200);

		expect(taskHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.description).toEqual(updatedDescription);
	});

	test("PATCH /tasks/:id rejects an unrelated user (403)", async () => {
		const disallowedDescription = "Not allowed";
		const response = await request(app)
			.patch(`/tasks/${charlieTask.id}`)
			.set(authHeader(bobToken))
			.send({ description: disallowedDescription })
			.expect(403);

		expect(response.body.error).toEqual("You do not have permission to modify this task");
	});

	test("PATCH /tasks/:id rejects moving a task to another user's project (403)", async () => {
		const tempTask = (
			await createTask(bobToken, {
				title: `Move task ${testRunId}`,
				description: "Before move",
				status: "todo",
				project_id: bobProject.id,
				assigned_to: bobId,
			}).expect(201)
		).body;

		const response = await request(app)
			.patch(`/tasks/${tempTask.id}`)
			.set(authHeader(bobToken))
			.send({ project_id: charlieProject.id })
			.expect(403);

		expect(response.body.error).toEqual("You do not have permission to modify this project");
	});

	test("PATCH /tasks/:id allows admin to move a task across projects (200)", async () => {
		const tempTask = (
			await createTask(adminToken, {
				title: `Admin move task ${testRunId}`,
				description: "Before admin move",
				status: "todo",
				project_id: bobProject.id,
				assigned_to: bobId,
			}).expect(201)
		).body;

		const response = await request(app)
			.patch(`/tasks/${tempTask.id}`)
			.set(authHeader(adminToken))
			.send({ project_id: charlieProject.id })
			.expect(200);

		expect(taskHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.projectId).toEqual(charlieProject.id);
	});

	test("PATCH /tasks/:id lets non-admin move task between own projects (200)", async () => {
		const ownProjectAName = `Bob own project A ${testRunId}`;
		const ownProjectBName = `Bob own project B ${testRunId}`;
		const taskTitle = `Bob movable task ${testRunId}`;
		const taskDescription = "Task that Bob will move between owned projects";

		const ownProjectA = (
			await createProject(bobToken, {
				name: ownProjectAName,
				description: "Owned by Bob - source",
			}).expect(201)
		).body;

		const ownProjectB = (
			await createProject(bobToken, {
				name: ownProjectBName,
				description: "Owned by Bob - destination",
			}).expect(201)
		).body;

		const movableTask = (
			await createTask(bobToken, {
				title: taskTitle,
				description: taskDescription,
				status: "todo",
				project_id: ownProjectA.id,
				assigned_to: bobId,
			}).expect(201)
		).body;

		const response = await request(app)
			.patch(`/tasks/${movableTask.id}`)
			.set(authHeader(bobToken))
			.send({ project_id: ownProjectB.id })
			.expect(200);

		expect(taskHasValidSignature(response.body)).toBeTruthy();
		expect(response.body.projectId).toEqual(ownProjectB.id);
		expect(response.body.title).toEqual(taskTitle);
		expect(response.body.description).toEqual(taskDescription);
	});

	test("DELETE /tasks/:id deletes an allowed task (204)", async () => {
		const tempTask = (
			await createTask(bobToken, {
				title: `Delete task ${testRunId}`,
				description: "Before delete",
				status: "todo",
				project_id: bobProject.id,
				assigned_to: bobId,
			}).expect(201)
		).body;

		await request(app)
			.delete(`/tasks/${tempTask.id}`)
			.set(authHeader(bobToken))
			.expect(204);

		await request(app)
			.get(`/tasks/${tempTask.id}`)
			.set(authHeader(bobToken))
			.expect(404);
	});

	test("DELETE /tasks/:id rejects an unauthorized user (403)", async () => {
		const response = await request(app)
			.delete(`/tasks/${charlieTask.id}`)
			.set(authHeader(bobToken))
			.expect(403);

		expect(response.body.error).toEqual("You do not have permission to modify this task");
	});

	test("DELETE /tasks/:id rejects a missing task (404)", async () => {
		const response = await request(app)
			.delete("/tasks/999999")
			.set(authHeader(adminToken))
			.expect(404);

		expect(response.body.error).toEqual("Task not found with ID 999999");
	});
});
