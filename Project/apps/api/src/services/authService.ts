import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { env } from "../config/env";
import { UserService } from "./userService";

export interface AuthTokenPayload {
	userId: number;
	email: string;
	role: string;
}

export interface PublicUserRecord {
	id: number;
	name: string;
	email: string;
	role: string;
	createdAt: string;
}

type UserAuthRecord = PublicUserRecord & {
	passwordHash: string;
};

const jwtSecret = env.jwtSecret;

export class AuthService {
	private readonly userService: UserService;

	constructor(private readonly pool: Pool) {
		this.userService = new UserService(pool);
	}

	async registerUser(input: {
		name: string;
		email: string;
		password: string;
	}): Promise<PublicUserRecord> {
		const existingUser = await this.userService.getUserByEmail(input.email);
		if (existingUser) {
			throw new Error("Email already exists.");
		}

		const user = await this.userService.createUserWithPassword({
			name: input.name,
			email: input.email,
			password: input.password,
			role: "user",
		});

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
		};
	}

	async loginUser(input: {
		email: string;
		password: string;
	}): Promise<string | null> {
		const result = await this.pool.query<UserAuthRecord>(
			`SELECT id,
				name,
				email,
				password_hash AS "passwordHash",
				role,
				created_at AS "createdAt"
			 FROM users
			 WHERE email = $1`,
			[input.email],
		);

		const user = result.rows[0];
		if (!user) {
			return null;
		}

		const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
		if (!passwordMatches) {
			return null;
		}

		const payload: AuthTokenPayload = {
			userId: user.id,
			email: user.email,
			role: user.role,
		};

        // return the signed payload
		return jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
	}
}