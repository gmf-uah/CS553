import { Router } from 'express';
import { db } from '../database.js';
console.log(1)
import {
    authenticateToken,
    requireRole
} from "../middleware/auth.js";
import { notFound } from '../middleware/errorHandler.js';

export const tasksRouter = Router();

tasksRouter.get("/",
    authenticateToken,
    requireRole("student", "instructor"),
    (req, res) => {
        res.json({
            userId: req.user.sub,
            tasks: []
        });
    }
);

tasksRouter.get('/:id',
    authenticateToken,
    requireRole("student", "instructor"),
    async (req, res, next) => {
        try {
            // console.log(4, req.user)
            const result = await db.query( // student_id AS studentId is the aliaser
                "SELECT id, title, course, student_id AS studentId, completed FROM tasks WHERE id = ?",
                [req.params.id]
            );

            const task = result.rows[0];

            // console.log(5, task)
            if (!task) {
                return notFound(req, res);
            }

            // shame it takes a whole database query to determine 403
            if (req.user.role === "student" && task.studentId !== req.user.sub) {
                return res.status(403).json({ error: "Forbidden" });
            }

            // pdf says explicitly return 200, but it's not really necessary
            // also `...task` is a nice way to put `task` in the response with the modified `task.completed`
            return res.status(200).json({ ...task, completed: Boolean(task.completed) });
        } catch (error) {
            return next(error);
        }
    });

tasksRouter.delete(
    "/:id",
    authenticateToken,
    requireRole("instructor"),
    async (req, res, next) => {
        try {
            const result = await db.run(
                "DELETE FROM tasks WHERE id = ?",
                [req.params.id]
            );

            if (result.changes === 0) {
                return res.status(404).json({ error: "Not Found" });
            }

            return res.status(204).end();
        } catch (error) {
            return next(error);
        }
    }
);
