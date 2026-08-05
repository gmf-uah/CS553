import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// The imports above are supplied so students can use jwt and config.jwtSecret.
export function authenticateToken(req, res, next) {
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

        req.user = user;
        // i dont like using req.user, as res.locals is the intended place for storage by the server
        next();
    } catch {
        res.status(401).json({ error: "Authentication required" });
    }
}

export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        if (allowedRoles.includes(user.role)) {
            next()
        } else {
            return res.status(403).json({
                error: `This action requires one of these roles: ${allowedRoles.join(", ")}.`,
            });
        }
    };
}

void jwt;
void config;
