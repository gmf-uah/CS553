import express from 'express';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { reportsRouter } from './routes/reports.js';
import { tasksRouter } from './routes/tasks.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/tasks', tasksRouter);
  app.use('/reports', reportsRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
