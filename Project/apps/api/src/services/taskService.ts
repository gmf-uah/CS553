import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { collectValidFields, SchemaDefinition } from "../middleware/validator";
import { DatabaseService } from "./databaseService";

export interface TaskRecord { // beautiful
    // keeps in line with schema.sql
    id: number;
    title: string;
    description: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export enum TaskValidationMode {
    CREATE_MINIMUM = 1,
    UPDATE_PARTIAL = 2,
}

export const TASK_SCHEMA = Object.freeze({
    title: {
        dataType: "string",
        requiredForCreateMinimum: true,
        writable: true, // forgot why i kept this after removing the other entries like id
    },
    description: {
        dataType: "string",
        requiredForCreateMinimum: false,
        writable: true,
    },
    status: {
        dataType: "string",
        requiredForCreateMinimum: false,
        writable: true,
    },
}) satisfies SchemaDefinition & Record<string, { writable: boolean }>;
// apparently you can do this if you dont know how to write the type declarations before the equal sign

const TASK_RETURNING_CLAUSE = `id,
    title,
    description,
    status,
    created_at AS "createdAt",
    updated_at AS "updatedAt"`;

// we need to do `typeof` first because it's an instance and we need to convert it to a type first
// then keyof gets the name of the keys
// The result is the union of schema keys: "title" | "description" | "status"
// So those 3 are writable fields (can be sent in the request body and written to the database)
type TaskWritableField = keyof typeof TASK_SCHEMA;

export function validateTask(validationMode: TaskValidationMode) {
    return (req: Request, res: Response, next: NextFunction) => {
        const validFields =
            collectValidFields(req.body as Record<string, unknown>, TASK_SCHEMA, validationMode);
            // validationMode === TaskValidationMode.CREATE_MINIMUM
            //     ? collectValidCreateFields(req.body as Record<string, unknown>, TASK_SCHEMA)
            //     : collectValidPartialFields(req.body as Record<string, unknown>, TASK_SCHEMA);

        if (!validFields) {
            const errorMessage = // didnt feel like doing the whole "return success: bool, error: Error | null" idiom
                validationMode === TaskValidationMode.CREATE_MINIMUM
                    ? "Invalid task schema. Required fields must be present and all provided fields must have correct data types"
                    : "At least one update field must be provided and all update fields must have correct data types";

            return res.status(400).json({ error: errorMessage });
        }

        res.locals.validFields = validFields;
        next();
    };
}

export class TaskService {
    private readonly databaseService: DatabaseService;

    constructor(private readonly pool: Pool) {
        this.databaseService = new DatabaseService(pool);
    }

    // all async functions return promises
    // upon success, the value returned by the promise is an array of taskRecords
    async getAllTasks(): Promise<TaskRecord[]> {
        const result = await this.pool.query<TaskRecord>(
            `SELECT ${TASK_RETURNING_CLAUSE}
             FROM tasks
             ORDER BY id`,
        );

        return result.rows;
    }

    async getTaskById(id: number): Promise<TaskRecord | null> {
        const result = await this.pool.query<TaskRecord>(
            `SELECT ${TASK_RETURNING_CLAUSE}
             FROM tasks
             WHERE id = $1`,
            [id],
        );

        // dont reject the promise if nothing was there
        // instead return null, so the server sees that and 404's
        return result.rows[0] ?? null;
    }

    async createTask(payload: Record<string, unknown>, fields: string[]): Promise<TaskRecord> {
        const insertableFields = this.getWritableFields(fields);
        const query = this.databaseService.buildInsertQuery("tasks", payload, insertableFields, TASK_RETURNING_CLAUSE);
        const task = await this.databaseService.executeSingleRowQuery<TaskRecord>(query);

        if (!task) {
            throw new Error("Failed to create task");
        }

        return task;
    }

    async updateTask(id: number, payload: Record<string, unknown>, fields: string[]): Promise<TaskRecord | null> {
        const updatableFields = this.getWritableFields(fields);

        if (updatableFields.length === 0) {
            throw new Error("At least one update field must be provided");
        }

        const query = this.databaseService.buildUpdateQuery("tasks", id, payload, updatableFields, TASK_RETURNING_CLAUSE);
        return this.databaseService.executeSingleRowQuery<TaskRecord>(query);
    }

    async replaceTask(id: number, payload: Record<string, unknown>, fields: string[]): Promise<TaskRecord | null> {
        const providedWritableFields = this.getWritableFields(fields);

        if (providedWritableFields.length === 0) {
            throw new Error("At least one replace field must be provided");
        }

        const allWritableFields = this.getWritableFields(Object.keys(TASK_SCHEMA));
        const query = this.databaseService.buildReplaceQuery(
            "tasks",
            id,
            payload,
            providedWritableFields,
            allWritableFields,
            TASK_RETURNING_CLAUSE,
        );

        // in databaseService, we dont know that it's tasks we are querying, so we use T
        // Here we use TaskRecord in place of T
        return this.databaseService.executeSingleRowQuery<TaskRecord>(query);
    }

    async deleteTask(id: number): Promise<boolean> {
        const result = await this.pool.query("DELETE FROM tasks WHERE id = $1 RETURNING id", [id]);
        return result.rowCount === 1
    }

    // dont include id in the writable fields
    private getWritableFields(fields: string[]): TaskWritableField[] {
        return fields.filter((fieldName): fieldName is TaskWritableField =>
            TASK_SCHEMA[fieldName as TaskWritableField]?.writable === true,
        );
    }

}