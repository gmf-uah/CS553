import { db } from '../database.js';
import { generateReport } from '../reportGenerator.js';
import { reportQueue } from '../reportQueue.js';

reportQueue.process(async (message) => {
  const { jobId, studentId } = message;

  // TODO(PART 5): Mark this job as "processing" with db.updateReportJob().
  // TODO(PART 5): Call generateReport(studentId).
  // TODO(PART 5): Mark it "completed" and save the downloadUrl.
  // TODO(PART 5): Catch generation errors, mark the job "failed", and do not crash the worker.
  void jobId;
  void studentId;
  void db;
  void generateReport;
});
