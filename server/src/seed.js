import bcrypt from 'bcryptjs';
import pool from './db.js';

const email = (process.env.SEED_EMAIL || 'admin@company.com').toLowerCase().trim();
const password = process.env.SEED_PASSWORD || 'ChangeMe123!';
const name = process.env.SEED_NAME || 'Admin';

const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
if (rows[0]) {
  console.log(`User ${email} already exists (id=${rows[0].id}). Skipping.`);
} else {
  const hash = bcrypt.hashSync(password, 10);
  const { rows: inserted } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [name, email, hash]
  );
  console.log(`Created user ${email} (id=${inserted[0].id}) with password: ${password}`);
}

await pool.end();
