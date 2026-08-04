import { db } from '../src/database.js';

await db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  student_id TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1))
)`);

await db.run(`CREATE TABLE IF NOT EXISTS report_jobs (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL,
  download_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

const seedTasks = [
  ['task-001', 'Watch Week 6 lecture', 'CS453', 'djs001', 0],
  ['task-002', 'Complete REST API exercise', 'CS453', 'djs001', 1],
  ['task-003', 'Read authentication notes', 'CS453', 'student002', 0]
];

for (const task of seedTasks) {
  await db.run(
    `INSERT INTO tasks (id, title, course, student_id, completed)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title, course = excluded.course,
       student_id = excluded.student_id, completed = excluded.completed`,
    task
  );
}

console.log('Database initialized and sample tasks seeded.');
await db.close();
