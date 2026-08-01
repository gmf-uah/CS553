import type { Application } from "express";
import { Pool } from "pg";
import { internalServerError } from "../util"

export function registerHealthRoutes(app: Application, pool: Pool) {
    app.get("/health", (_req, res) => {
        res.json({
            status: "ok",
            service: "cs453-api",
        });
    });

    app.get("/db-health", async (_req, res) => {
        try {
            const result = await pool.query("SELECT NOW() AS current_time");
            res.json({
                status: "ok",
                database: "connected",
                currentTime: result.rows[0].current_time,
            });
        } catch (error) {
            internalServerError(error, "Database health check failed", res);
        }
    });
}