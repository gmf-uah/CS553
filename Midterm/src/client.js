const API_BASE_URL = "http://localhost:3000";

async function checkHealth() {
    const response = await fetch(`${API_BASE_URL}/health`)
    const data = await response.json()
    if (response.ok) {
        console.log("Health ok")
    } else {
        throw new Errror(data.error ?? `GET /health failed with status ${response.status}`)
    }
}

async function getAllTasks() {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    const data = await response.json()
    if (response.ok) {
        console.log("All tasks:", data)
    } else {
        throw new Error(data.error ?? `GET /tasks failed with status ${response.status}`)
    }
}

async function getTask(id) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
    const data = await response.json();
    if (response.ok) {
        console.log("Got task:", data);
    } else {
        throw new Error(data.error ?? `GET /tasks/${id} failed with status ${response.status}`);
    }
}

async function createTask(task) {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST", // json block reminds me of test.js files from our labs
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
    });

    // following the format of labs repo examples/04b-api-client/client/app.js
    const data = await response.json();
    if (response.ok) {
        console.log("Created task:", data);
    } else {
        throw new Error(data.error ?? `POST /tasks failed with status ${response.status}`);
    }
}

async function replaceTask(id, task) { // wrote this before i saw midterm said it wasn't needed
    // calling location is commented out though
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
    });

    const data = await response.json();
    if (response.ok) {
        console.log("Replaced task:", data);
    } else {
        throw new Error(data.error ?? `PUT /tasks/${id} failed with status ${response.status}`);
    }
}

async function updateTask(id, fields) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields)
    });

    const data = await response.json();
    if (response.ok) {
        console.log("Updated task:", data);
    } else {
        throw new Error(data.error ?? `PATCH /tasks/${id} failed with status ${response.status}`);
    }
}

async function deleteTask(id) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, { method: "DELETE" });
    if (response.ok) {
        console.log(`Deleted task ${id}`);
    } else {
        const data = await response.json();
        throw new Error(data.error ?? `DELETE /tasks/${id} failed with status ${response.status}`);
    }
}

// these look weird because im used to curl
await checkHealth()
await createTask({ title: "Homework 4", course: "MA 799", completed: true });
await getAllTasks();
await getTask(1);
// await replaceTask(1, { title: "Class dismissed", course: "CS 1000", completed: true });
await updateTask(1, { title: 12, course: "CS 788", garbage: "nothing" })
await deleteTask(1);
// await getAllTasks() // get all tasks again so we can have a good before-and-after look