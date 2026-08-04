import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'cs453-final-'));
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_FILE = path.join(testDirectory, 'test.db');

const { db } = await import('../src/database.js');
const { ReportQueue } = await import('../src/reportQueue.js');
const { generateReport } = await import('../src/reportGenerator.js');
const { createApp } = await import('../src/app.js');

test.before(async () => {
  await db.run(`CREATE TABLE IF NOT EXISTS report_jobs (
    id TEXT PRIMARY KEY, student_id TEXT NOT NULL, status TEXT NOT NULL,
    download_url TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
});

test.after(async () => {
  await db.close();
  await fs.rm(testDirectory, { recursive: true, force: true });
});

test('db.query uses parameters and returns rows', async () => {
  const value = "student' OR 1=1";
  const result = await db.query('SELECT ? AS value', [value]);
  assert.deepEqual(result.rows, [{ value }]);
});

test('report-job helpers create, update, and retrieve a job', async () => {
  const id = randomUUID();
  await db.createReportJob({ id, studentId: 'djs001', status: 'pending' });
  await db.updateReportJob(id, { status: 'completed', downloadUrl: '/downloads/example.json' });
  const job = await db.getReportJob(id);
  assert.equal(job.status, 'completed');
  assert.equal(job.downloadUrl, '/downloads/example.json');
  assert.equal(job.studentId, 'djs001');
});

test('queue waits for a processor and preserves FIFO order', async () => {
  const queue = new ReportQueue();
  const processed = [];
  await queue.send({ number: 1 });
  await queue.send({ number: 2 });
  queue.process(async (message) => {
    processed.push(message.number);
  });
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.deepEqual(processed, [1, 2]);
});

test('report generator resolves asynchronously with a download URL', async () => {
  let resolved = false;
  const report = generateReport('djs001').then((url) => {
    resolved = true;
    return url;
  });
  assert.equal(resolved, false);
  assert.match(await report, /^\/downloads\/report-djs001-.+\.json$/);
});

test('application returns JSON for an unknown route', async () => {
  const app = createApp();
  const response = await new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ status: this.statusCode, body });
      },
      setHeader() {},
      end() {}
    };
    app.handle({ method: 'GET', url: '/missing', headers: {} }, res, reject);
  });
  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { error: 'Not Found' });
});
