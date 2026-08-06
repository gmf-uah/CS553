import { db } from '../database.js';
import { generateReport } from '../reportGenerator.js';
import { reportQueue } from '../reportQueue.js';

reportQueue.process(async (message) => {
    const { jobId, studentId } = message;

    // ensure the report doesn't start generating until after we have marked its status
    await db.updateReportJob(jobId, { status: 'processing' });
    try {
        // this is the part that will take a while
        const downloadUrl = await generateReport(studentId);
        // once finished, change status and provide the download url
        await db.updateReportJob(jobId, { status: 'completed', downloadUrl });
    } catch (error) {
        await db.updateReportJob(jobId, { status: 'failed' });
    }
});
