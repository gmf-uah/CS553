import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { db } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { reportQueue } from '../reportQueue.js';

export const reportsRouter = Router();

reportsRouter.post('/', authenticateToken, async (req, res, next) => {
    try {
        const jobId = randomUUID(); // could also use an incrementing ID but nah
        const studentId = req.user.sub;
        // create the report job that the reportqueue will fill using the jobId as reference
        await db.createReportJob({ id: jobId, studentId, status: 'pending', downloadUrl: null });
        await reportQueue.send({ jobId, studentId });
        // let the client do the work of getting the report
        // (we dont have publish/subscribe in this codebase)
        return res.status(202).json({ jobId, status: 'pending', statusUrl: `/reports/${jobId}` });
    } catch (error) {
        return next(error);
    }
});

reportsRouter.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const job = await db.getReportJob(req.params.id);
        if (!job) return res.status(404).json({ error: 'Not Found' });
        return res.json(job);
    } catch (error) {
        return next(error);
    }
});

void reportQueue;
