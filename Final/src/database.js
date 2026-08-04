import fs from 'node:fs/promises';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { config } from './config.js';

let connection;

async function getConnection() {
  if (!connection) {
    await fs.mkdir(path.dirname(config.databaseFile), { recursive: true });
    connection = await open({ filename: config.databaseFile, driver: sqlite3.Database });
    await connection.exec('PRAGMA foreign_keys = ON');
  }
  return connection;
}

export const db = {
  async query(sql, parameters = []) {
    const database = await getConnection();
    const rows = await database.all(sql, parameters);
    return { rows };
  },

  async run(sql, parameters = []) {
    const database = await getConnection();
    return database.run(sql, parameters);
  },

  async createReportJob({ id, studentId, status, downloadUrl = null }) {
    await this.run(
      `INSERT INTO report_jobs (id, student_id, status, download_url)
       VALUES (?, ?, ?, ?)`,
      [id, studentId, status, downloadUrl]
    );
    return this.getReportJob(id);
  },

  async updateReportJob(jobId, { status, downloadUrl = null }) {
    await this.run(
      `UPDATE report_jobs
       SET status = ?, download_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, downloadUrl, jobId]
    );
    return this.getReportJob(jobId);
  },

  async getReportJob(jobId) {
    const result = await this.query(
      `SELECT id, student_id AS studentId, status,
              download_url AS downloadUrl, created_at AS createdAt, updated_at AS updatedAt
       FROM report_jobs WHERE id = ?`,
      [jobId]
    );
    return result.rows[0] ?? null;
  },

  async close() {
    if (connection) {
      await connection.close();
      connection = undefined;
    }
  }
};
