import jwt from 'jsonwebtoken';
import { config } from '../src/config.js';

const options = { expiresIn: '2h' };
const users = [
  ['Student (djs001)', { sub: 'djs001', role: 'student' }],
  ['Student (student002)', { sub: 'student002', role: 'student' }],
  ['Instructor', { sub: 'instructor001', role: 'instructor' }]
];

for (const [label, payload] of users) {
  console.log(`${label}: ${jwt.sign(payload, config.jwtSecret, options)}`);
}

console.log('\nDevelopment tokens only: they are not OAuth or a production login system.');
