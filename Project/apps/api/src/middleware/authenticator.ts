import jwt, { type JwtPayload } from "jsonwebtoken";
import type { RequestHandler } from "express";
const jwtSecret = process.env.JWT_SECRET ?? "temporary-jwt-secret";

export interface AuthenticatedUser {
    userId: number;
    email: string;
    role: string;
}

export function toAuthenticatedUser(payload: unknown): AuthenticatedUser | null {
    if (typeof payload !== "object" || payload === null) {
        return null;
    }

    const maybePayload = payload as JwtPayload;
    const { userId, email, role } = maybePayload as JwtPayload & {
        userId?: unknown;
        email?: unknown;
        role?: unknown;
    };

    if (
        typeof userId !== "number" ||
        typeof email !== "string" ||
        typeof role !== "string"
    ) {
        return null;
    }

    return { userId, email, role };
}

// forgot to add jwt to the dev dependenices in package.json
// before i remembered to do that, jwt and bcrypt werent valid in the linter's eyes
// therefore, i would simulate the types exported from those packages to silence the linter
// hence the following commented type

// type JwtPayload = {
//     [key: string]: unknown;
//     exp?: number;
//     iat?: number;
// };

// this was a dumb idea
// type AuthenticatedRequest = Request & { // a normal request ANDed with a user
//     user?: JwtPayload | string;
// };

const authenticateToken: RequestHandler = (req, res, next) => {
    const authorization = req.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Send a Bearer token in the Authorization header." });
        return;
    }

    const token = authorization.slice("Bearer ".length);

    try {
        const payload = jwt.verify(token, jwtSecret); // does the token have the jwt signature?
        const user = toAuthenticatedUser(payload);

        if (!user) {
			res.status(401).json({ error: "Invalid authentication token payload" });
			return;
		}

        res.locals.user = user;
        // also, don't just put the user into the request object by itself as was the case in example 6.
        // while valid and normal for server side code,
        // it aggravates the typescript linter.
        // this is because new data is meant to be put in res.locals.
        next();
    } catch {
        res.status(401).json({ error: "Authentication required" });
    }
};

export default authenticateToken;

// function taken from example 06 repo, just like authenticateToken
// modified with typescript annotations
export function requireRole(...roles: string[]): RequestHandler {
    // this syntax resembles my validateId syntax from like 2 labs ago :)
    return (req, res, next) => {
        const user = toAuthenticatedUser(res.locals.user);

        if (!user) {
			return res.status(401).json({ error: "Authentication required" });
		}

        if (roles.includes(user.role)) {
            next()
        } else {
            return res.status(403).json({
                error: "Forbidden",
                message: `This action requires one of these roles: ${roles.join(", ")}.`
            });
        }
    };
}