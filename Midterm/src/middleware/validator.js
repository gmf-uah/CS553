const tasks = [
    {
        "id": 1,
        "title": "Watch Week 3 lecture",
        "course": "CS453",
        "completed": false
    }
];
let nextId = tasks.length + 1;

const notEnoughFieldsErr = "Incoming task does not have all fields to be a new task object"
function requestHasAllTaskFields(req) {
    // note that we dont do any length checks
    // user could update one of a task's fields to be a massive string
    return typeof req.title == "string" &&
        typeof req.course == "string" &&
        typeof req.completed == "boolean"
}

export function validator(req, res, next) {
    const givenId = req.params.id
    // console.log(0, givenId)
    if (givenId !== undefined) { // If an ID was provided, ...
        // ... then verify a task by that ID exists
        const referencedTask = tasks.find(task => task.id === Number(givenId))
        const hasValidId = referencedTask !== undefined

        // console.log(1, referencedTask, hasValidId)
        if (hasValidId) {
            req.task = referencedTask
            switch (req.method) {
                case "GET":
                    // do nothing more because we already validated the id
                    break;
                case "PUT":
                    // console.log("Attempting PUT")
                    if (requestHasAllTaskFields(req.body)) {
                        req.task.course = req.body.course
                        req.task.title = req.body.title
                        req.task.completed = req.body.completed
                    } else {
                        return res.status(400).json({ error: notEnoughFieldsErr })
                    }
                    break;
                case "PATCH":
                    let thereIsAtLeastOneValidField = false;
                    for (const key of ["course", "title", "completed"]) {
                        const keyType = typeof req.body[key]
                        if (keyType !== undefined && keyType == typeof referencedTask[key]) {
                            // if there is a matching key, and it is the same type, then count as valid
                            thereIsAtLeastOneValidField = true; // idempotent
                            referencedTask[key] = req.body[key] // overwrite
                        }
                    }
                    if (!thereIsAtLeastOneValidField) {
                        return res.status(400).json({ error: "At least one update field must be provided" })
                    }
                    break;
                case "DELETE":
                    let index = tasks.indexOf(referencedTask)
                    tasks.splice(index, 1)
                    break;
            }
        } else {
            return res.status(404).json({ error: "Task ID not found" })
        }
    } else { // if no id was provided, ...
        switch (req.method) { // ... determine which HTTP method we are calling
            case "POST": // add a new task
                if (requestHasAllTaskFields(req.body)) {
                    const task = {
                        id: nextId,
                        title: req.body.title,
                        course: req.body.course,
                        completed: req.body.completed
                    };
                    nextId++;
                    req.task = task
                    tasks.push(task);
                } else { // copy paste =(
                    return res.status(400).json({ error: notEnoughFieldsErr });
                }
                break;
            case "GET": // get all the existing tasks
                req.tasks = tasks
                break;
            default:
                return res.status(404).json({ error: "Unknown HTTP method" })
        }
    }
    // console.log("tasks is currently", req.tasks)
    next()
}
