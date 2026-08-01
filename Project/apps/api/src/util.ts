import type { Application, Response } from "express";

export function internalServerError(error: unknown, message: string, res: Response) {
    const errorMessage = `Internal Server Error: ${message}`;
    console.error(errorMessage, error);
    return res.status(500).json({ error: errorMessage });
}