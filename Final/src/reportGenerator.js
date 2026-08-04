import { randomUUID } from 'node:crypto';

export async function generateReport(studentId) {
  await new Promise((resolve) => setTimeout(resolve, 25));
  if (process.env.SIMULATE_REPORT_FAILURE === 'true') {
    throw new Error('Simulated report-generation failure');
  }
  return `/downloads/report-${studentId}-${randomUUID()}.json`;
}
