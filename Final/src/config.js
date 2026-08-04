import 'dotenv/config';
import path from 'node:path';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Copy .env.example to .env and set a value.`);
  }
  return value;
}

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port number.');
}

export const config = {
  port,
  jwtSecret: required('JWT_SECRET'),
  databaseFile: path.resolve(process.cwd(), required('DATABASE_FILE'))
};
