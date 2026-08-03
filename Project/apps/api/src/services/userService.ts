import bcrypt from "bcryptjs";
import { type RequestHandler } from "express";
import { Pool } from "pg";
import {
	collectValidFields,
	SchemaDefinition,
	ValidationMode,
} from "../middleware/validator";
import { DatabaseService } from "./databaseService";

export interface UserRecord {
	id: number;
	name: string;
	email: string;
	passwordHash: string;
	role: string;
	createdAt: string;
}

// json object
export interface CreateUserFromPasswordInput {
	name: string;
	email: string;
	password: string;
	role?: string;
}

export const UserValidationMode = ValidationMode;

export const USER_SCHEMA = Object.freeze({
	name: {
		dataType: "string",
		requiredForCreateMinimum: true,
		writable: true,
	},
	email: {
		dataType: "string",
		requiredForCreateMinimum: true,
		writable: true,
	},
	password_hash: {
		dataType: "string",
		requiredForCreateMinimum: true,
		writable: true,
	},
	role: {
		dataType: "string",
		requiredForCreateMinimum: true,
		writable: true,
	},
}) satisfies SchemaDefinition & Record<string, { writable: boolean }>;

export const USER_INPUT_SCHEMA = Object.freeze({
	name: {
		dataType: "string",
		requiredForCreateMinimum: true,
		writable: true,
	},
	email: {
		dataType: "string",
		requiredForCreateMinimum: true,
		writable: true,
	},
	password: {
		dataType: "string",
		requiredForCreateMinimum: true,
		writable: true,
	},
	role: {
		dataType: "string",
		requiredForCreateMinimum: true,
		writable: true,
	},
}) satisfies SchemaDefinition & Record<string, { writable: boolean }>;

const USER_RETURNING_CLAUSE = `id,
    name,
    email,
    password_hash AS "passwordHash",
    role,
    created_at AS "createdAt"`;

const DEFAULT_ROLE = "user";
const SALT_ROUNDS = 10;

type UserWritableField = keyof typeof USER_SCHEMA;

export function validateUser(
	validationMode: ValidationMode,
	schema: SchemaDefinition & Record<string, { writable: boolean }> = USER_SCHEMA,
): RequestHandler {
	return (req, res, next) => {
		const validFields = collectValidFields(
			req.body as Record<string, unknown>,
			schema,
			validationMode,
		);

		if (!validFields) {
			const errorMessage =
				validationMode === ValidationMode.CREATE_MINIMUM
					? "Invalid user schema. Required fields must be present and all provided fields must have correct data types"
					: "At least one update field must be provided and all update fields must have correct data types";

			return res.status(400).json({ error: errorMessage });
		}

		res.locals.validFields = validFields;
		next();
	};
}

export class UserService {
	private readonly databaseService: DatabaseService;

	constructor(private readonly pool: Pool) {
		this.databaseService = new DatabaseService(pool);
	}

	async getAllUsers(): Promise<UserRecord[]> {
		const result = await this.pool.query<UserRecord>(
			`SELECT ${USER_RETURNING_CLAUSE}
             FROM users
             ORDER BY id`,
		);

		return result.rows;
	}

	async getUserById(id: number): Promise<UserRecord | null> {
		const result = await this.pool.query<UserRecord>(
			`SELECT ${USER_RETURNING_CLAUSE}
             FROM users
             WHERE id = $1`,
			[id],
		);

		return result.rows[0] ?? null;
	}

	async getUserByEmail(email: string): Promise<UserRecord | null> {
		const result = await this.pool.query<UserRecord>(
			`SELECT ${USER_RETURNING_CLAUSE}
			 FROM users
			 WHERE email = $1`,
			[email],
		);

		return result.rows[0] ?? null;
	}

    // create a user directly from a POST request
	async createUser(
		payload: Record<string, unknown>,
		fields: string[],
	): Promise<UserRecord> {
		const insertableFields = this.getWritableFields(fields);
		const normalizedPayload = { ...payload };

		if (fields.includes("password")) {
			const password = normalizedPayload.password;
			if (typeof password !== "string") {
				throw new Error("Password must be a string");
			}

			normalizedPayload.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
			delete normalizedPayload.password;
			if (!insertableFields.includes("password_hash")) {
				insertableFields.push("password_hash");
			}
		}

		return this.createUserFromPayloadAndFields(normalizedPayload, insertableFields);
	}

    // create a user from /auth/register (through authService)
	async createUserWithPassword(
		input: CreateUserFromPasswordInput,
	): Promise<UserRecord> {
		const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

		return this.createUserFromPayloadAndFields(
			{
				name: input.name,
				email: input.email,
				password_hash: passwordHash,
				role: input.role ?? DEFAULT_ROLE,
			},
			["name", "email", "password_hash", "role"],
		);
	}

	// Startup bootstrap uses this to create or promote the configured administrator.
	async ensureAdminUser(input: {
		name: string;
		email: string;
		password: string;
	}): Promise<"created" | "promoted" | "unchanged"> {
		const existing = await this.getUserByEmail(input.email);

		if (!existing) {
			await this.createUserWithPassword({
				name: input.name,
				email: input.email,
				password: input.password,
				role: "admin",
			});
			return "created";
		}

		if (existing.role === "admin") {
			return "unchanged";
		}

		const updated = await this.updateUser(
			existing.id,
			{ role: "admin" },
			["role"],
		);
		if (!updated) {
			throw new Error("Failed to promote configured admin user");
		}

		return "promoted";
	}

    // for the remaining user routes
	async updateUser(
		id: number,
		payload: Record<string, unknown>,
		fields: string[],
	): Promise<UserRecord | null> {
		const updatableFields = this.getWritableFields(fields);

		if (updatableFields.length === 0) {
			throw new Error("At least one update field must be provided");
		}

		const query = this.databaseService.buildUpdateQuery(
			"users",
			id,
			payload,
			updatableFields,
			USER_RETURNING_CLAUSE,
		);
		return this.databaseService.executeSingleRowQuery<UserRecord>(query);
	}

	async replaceUser(
		id: number,
		payload: Record<string, unknown>,
		fields: string[],
	): Promise<UserRecord | null> {
		const providedWritableFields = this.getWritableFields(fields);

		if (providedWritableFields.length === 0) {
			throw new Error("At least one replace field must be provided");
		}

		const allWritableFields = this.getWritableFields(Object.keys(USER_SCHEMA));
		const query = this.databaseService.buildReplaceQuery(
			"users",
			id,
			payload,
			providedWritableFields,
			allWritableFields,
			USER_RETURNING_CLAUSE,
		);
		return this.databaseService.executeSingleRowQuery<UserRecord>(query);
	}

	async deleteUser(id: number): Promise<boolean> {
		const result = await this.pool.query(
			"DELETE FROM users WHERE id = $1 RETURNING id",
			[id],
		);
		return result.rowCount === 1;
	}

    // duplicate of other services' versions. did not finish generalizing
	private getWritableFields(fields: string[]): UserWritableField[] {
		return fields.filter(
			(fieldName): fieldName is UserWritableField =>
				USER_SCHEMA[fieldName as UserWritableField]?.writable === true,
		);
	}

    // the generalized function referenced by the direct POST user route, AND the registration route
	private async createUserFromPayloadAndFields(
		payload: Record<string, unknown>,
		insertableFields: UserWritableField[],
	): Promise<UserRecord> {
		const query = this.databaseService.buildInsertQuery(
			"users",
			payload,
			insertableFields,
			USER_RETURNING_CLAUSE,
		);
		const user = await this.databaseService.executeSingleRowQuery<UserRecord>(query);

		if (!user) {
			throw new Error("Failed to create user");
		}

		return user;
	}
}
