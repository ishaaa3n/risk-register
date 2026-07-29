import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'risk-register.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  p_value REAL NOT NULL,
  frequency TEXT NOT NULL,
  f_value REAL NOT NULL,
  severity TEXT NOT NULL,
  s_value REAL NOT NULL,
  people_exposed TEXT NOT NULL,
  np_value REAL NOT NULL,
  unmitigated_rrn REAL NOT NULL,
  unmitigated_risk_level TEXT NOT NULL,
  control_measure_description TEXT,
  effective INTEGER NOT NULL DEFAULT 0,
  independent INTEGER NOT NULL DEFAULT 0,
  auditable INTEGER NOT NULL DEFAULT 0,
  valid_status TEXT NOT NULL,
  control_measure TEXT NOT NULL,
  c_value REAL NOT NULL,
  mitigated_rrn REAL NOT NULL,
  mitigated_risk_level TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

export default db;
