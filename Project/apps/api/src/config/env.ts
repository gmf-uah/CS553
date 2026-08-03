import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

function parseBooleanEnv(value: string | undefined): boolean {
	return value === "true";
}

export const env = {
	port: Number(process.env.PORT || 3000),
	databaseUrl:
		process.env.DATABASE_URL ||
		"postgresql://postgres:postgres@localhost:5433/cs453",
	jwtSecret: process.env.JWT_SECRET ?? "temporary-jwt-secret",
	adminName: process.env.ADMIN_NAME ?? "",
	adminEmail: process.env.ADMIN_EMAIL ?? "",
	adminPassword: process.env.ADMIN_PASSWORD ?? "",
};
