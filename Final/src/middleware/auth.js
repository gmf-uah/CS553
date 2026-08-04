import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// The imports above are supplied so students can use jwt and config.jwtSecret.
export function authenticateToken(req, res, next) {
  // TODO(PART 3): Validate the Bearer JWT and set req.user before calling next().
  return res.status(501).json({ error: 'Authentication is not implemented yet.' });
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // TODO(PART 3): Authorize req.user.role against allowedRoles before calling next().
    return res.status(501).json({ error: 'Authorization is not implemented yet.' });
  };
}

void jwt;
void config;
