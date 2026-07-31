import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required (Postgres/Neon connection string)');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Neon (and most serverless Postgres) can drop idle connections at any time
// (autosuspend, network blips). Without this listener, an idle client error
// is an unhandled 'error' event and crashes the whole Node process — pg
// already discards the bad client and reconnects on the next query, so all
// this needs to do is stop that from being fatal.
pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error (idle client):', err.message);
});

await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  assessment_date TEXT NOT NULL,
  department TEXT NOT NULL,
  area TEXT NOT NULL,
  area_other TEXT,
  team_members TEXT,
  sub_area TEXT,
  job_task TEXT NOT NULL,
  sub_task TEXT,
  routine TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  hazard TEXT NOT NULL,
  hazard_other TEXT,
  hazard_description TEXT,
  hazard_photo_path TEXT,
  probability TEXT NOT NULL,
  p_value DOUBLE PRECISION NOT NULL,
  frequency TEXT NOT NULL,
  f_value DOUBLE PRECISION NOT NULL,
  severity TEXT NOT NULL,
  s_value DOUBLE PRECISION NOT NULL,
  people_exposed TEXT NOT NULL,
  np_value DOUBLE PRECISION NOT NULL,
  unmitigated_rrn DOUBLE PRECISION NOT NULL,
  unmitigated_risk_level TEXT NOT NULL,
  control_measure_description TEXT,
  effective INTEGER NOT NULL DEFAULT 0,
  independent INTEGER NOT NULL DEFAULT 0,
  auditable INTEGER NOT NULL DEFAULT 0,
  valid_status TEXT NOT NULL,
  control_measure TEXT NOT NULL,
  c_value DOUBLE PRECISION NOT NULL,
  mitigated_rrn DOUBLE PRECISION NOT NULL,
  mitigated_risk_level TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS immediate_action_plan TEXT;
`);

export default pool;
