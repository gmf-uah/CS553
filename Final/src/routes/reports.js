import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { db } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { reportQueue } from '../reportQueue.js';

export const reportsRouter = Router();

reportsRouter.post('/', authenticateToken, async (req, res, next) => {
  try {
    // TODO(PART 5): Create a pending report job with db.createReportJob().
    // TODO(PART 5): Send { jobId, studentId } to reportQueue.
    // TODO(PART 5): Return 202 with jobId, status, and statusUrl.
    // TODO(PART 5): Do not call generateReport() from this request handler.
    const jobId = randomUUID();
    const studentId = req.user.sub;
    return res.status(501).json({ error: 'Report submission is not implemented yet.' });
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
