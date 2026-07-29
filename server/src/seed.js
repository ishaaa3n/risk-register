import bcrypt from 'bcryptjs';
import db from './db.js';

const email = process.env.SEED_EMAIL || 'admin@company.com';
const password = process.env.SEED_PASSWORD || 'ChangeMe123!';
const name = process.env.SEED_NAME || 'Admin';

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
if (existing) {
  console.log(`User ${email} already exists (id=${existing.id}). Skipping.`);
} else {
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hash);
  console.log(`Created user ${email} (id=${info.lastInsertRowid}) with password: ${password}`);
}
