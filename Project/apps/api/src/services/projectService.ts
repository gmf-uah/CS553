import { type RequestHandler } from "express";
import { Pool } from "pg";
import {
	collectValidFields,
	SchemaDefinition,
	ValidationMode,
} from "../middleware/validator";
import { DatabaseService } from "./databaseService";

export interface ProjectRecord {
	id: number;
	name: string;
	description: string | null;
	ownerId: number;
	createdAt: string;
}

export const ProjectValidationMode = ValidationMode;

export const PROJECT_SCHEMA = Object.freeze({
	name: {
		dataType: "string",
		requiredForCreateMinimum: true,
		writable: true,
	},
	description: {
		dataType: "string",
		requiredForCreateMinimum: false,
		writable: true,
	},
	owner_id: {
		dataType: "number",
		requiredForCreateMinimum: false,
		writable: true,
	},
}) satisfies SchemaDefinition & Record<string, { writable: boolean }>;

const PROJECT_RETURNING_CLAUSE = `id,
    name,
    description,
    owner_id AS "ownerId",
    created_at AS "createdAt"`;

type ProjectWritableField = keyof typeof PROJECT_SCHEMA;

export function validateProject(validationMode: ValidationMode): RequestHandler {
	return (req, res, next) => {
		const validFields = collectValidFields(
			req.body as Record<string, unknown>,
			PROJECT_SCHEMA,
			validationMode,
		);

		if (!validFields) {
			const errorMessage =
				validationMode === ValidationMode.CREATE_MINIMUM
					? "Invalid project schema. Required fields must be present and all provided fields must have correct data types"
					: "At least one update field must be provided and all update fields must have correct data types";

			return res.status(400).json({ error: errorMessage });
		}

		res.locals.validFields = validFields;
		next();
	};
}

export class ProjectService {
	private readonly databaseService: DatabaseService;

	constructor(private readonly pool: Pool) {
		this.databaseService = new DatabaseService(pool);
	}

	async getAllProjects(): Promise<ProjectRecord[]> {
		const result = await this.pool.query<ProjectRecord>(
			`SELECT ${PROJECT_RETURNING_CLAUSE}
             FROM projects
             ORDER BY id`,
		);

		return result.rows;
	}

	async getProjectById(id: number): Promise<ProjectRecord | null> {
		const result = await this.pool.query<ProjectRecord>(
			`SELECT ${PROJECT_RETURNING_CLAUSE}
             FROM projects
             WHERE id = $1`,
			[id],
		);

		return result.rows[0] ?? null;
	}

	async createProject(
		payload: Record<string, unknown>,
		fields: string[],
	): Promise<ProjectRecord> {
		const insertableFields = this.getWritableFields(fields);
		const query = this.databaseService.buildInsertQuery(
			"projects",
			payload,
			insertableFields,
			PROJECT_RETURNING_CLAUSE,
		);
		const project =
			await this.databaseService.executeSingleRowQuery<ProjectRecord>(query);

		if (!project) {
			throw new Error("Failed to create project");
		}

		return project;
	}

	async updateProject(
		id: number,
		payload: Record<string, unknown>,
		fields: string[],
	): Promise<ProjectRecord | null> {
		const updatableFields = this.getWritableFields(fields);

		if (updatableFields.length === 0) {
			throw new Error("At least one update field must be provided");
		}

		const query = this.databaseService.buildUpdateQuery(
			"projects",
			id,
			payload,
			updatableFields,
			PROJECT_RETURNING_CLAUSE,
		);
		return this.databaseService.executeSingleRowQuery<ProjectRecord>(query);
	}

	async replaceProject(
		id: number,
		payload: Record<string, unknown>,
		fields: string[],
	): Promise<ProjectRecord | null> {
		const providedWritableFields = this.getWritableFields(fields);

		if (providedWritableFields.length === 0) {
			throw new Error("At least one replace field must be provided");
		}

		const allWritableFields = this.getWritableFields(Object.keys(PROJECT_SCHEMA));
		const query = this.databaseService.buildReplaceQuery(
			"projects",
			id,
			payload,
			providedWritableFields,
			allWritableFields,
			PROJECT_RETURNING_CLAUSE,
		);
		return this.databaseService.executeSingleRowQuery<ProjectRecord>(query);
	}

	async deleteProject(id: number): Promise<boolean> {
		const result = await this.pool.query(
			"DELETE FROM projects WHERE id = $1 RETURNING id",
			[id],
		);
		return result.rowCount === 1;
	}

	async getProjectOwnerId(id: number): Promise<number | null> {
		const result = await this.pool.query<{ ownerId: number }>(
			`SELECT owner_id AS "ownerId"
			 FROM projects
			 WHERE id = $1`,
			[id],
		);

		return result.rows[0]?.ownerId ?? null;
	}

	private getWritableFields(fields: string[]): ProjectWritableField[] {
		return fields.filter(
			(fieldName): fieldName is ProjectWritableField =>
				PROJECT_SCHEMA[fieldName as ProjectWritableField]?.writable === true,
		);
	}
}
