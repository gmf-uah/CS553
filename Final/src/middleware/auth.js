import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// The imports above are supplied so students can use jwt and config.jwtSecret.
// console.log(2)
export function authenticateToken(req, res, next) {
    const authorization = req.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Send a Bearer token in the Authorization header." });
        return;
    }

    const token = authorization.slice("Bearer ".length);

    try {
        // console.log(2.1)
        const user = jwt.verify(token, config.jwtSecret); // does the token have the jwt signature?
        // console.log(2.2, user)

        if (!user) {
            res.status(401).json({ error: "Invalid authentication token payload" });
            return;
        }

        // console.log(2.5);
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
            // console.log("user not provided")
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
