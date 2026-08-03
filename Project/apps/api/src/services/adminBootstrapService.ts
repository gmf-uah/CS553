import { env } from "../config/env";
import { isNonEmptyString } from "../util";
import { pool } from "./pool";
import { UserService } from "./userService";

function hasBootstrapCredentials(): boolean {
	return (
		isNonEmptyString(env.adminName) &&
		isNonEmptyString(env.adminEmail) &&
		isNonEmptyString(env.adminPassword)
	);
}

// On startup, ensure one configured administrator account exists.
export async function bootstrapAdminUser(): Promise<void> {
	if (!hasBootstrapCredentials()) {
		console.warn("Admin bootstrap skipped because admin env fields are incomplete.");
		return;
	}

	const userService = new UserService(pool);
	const outcome = await userService.ensureAdminUser({
		name: env.adminName.trim(),
		email: env.adminEmail.trim().toLowerCase(),
		password: env.adminPassword,
	});

	if (outcome === "created") {
		console.log(`Bootstrapped admin user ${env.adminEmail.trim().toLowerCase()}.`);
		return;
	}

	if (outcome === "promoted") {
		console.log(
			`Promoted existing user ${env.adminEmail.trim().toLowerCase()} to admin.`,
		);
	}
}