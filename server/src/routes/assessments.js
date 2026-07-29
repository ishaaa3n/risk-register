import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  PROBABILITY_OPTIONS,
  FREQUENCY_OPTIONS,
  SEVERITY_OPTIONS,
  PEOPLE_EXPOSED_OPTIONS,
  CONTROL_MEASURE_OPTIONS,
  riskLevelForRRN,
  lookupValue
} from '../constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Nested under data/ (alongside the SQLite file) so a single persistent disk
// mounted at server/data covers both on hosts like Render.
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, png, or pdf files are allowed'));
  }
});

const router = Router();
router.use(requireAuth);

function computeDerived(body) {
  const p = lookupValue(PROBABILITY_OPTIONS, body.probability);
  const f = lookupValue(FREQUENCY_OPTIONS, body.frequency);
  const s = lookupValue(SEVERITY_OPTIONS, body.severity);
  const np = lookupValue(PEOPLE_EXPOSED_OPTIONS, body.people_exposed);
  const c = lookupValue(CONTROL_MEASURE_OPTIONS, body.control_measure);

  if ([p, f, s, np, c].some((v) => v === null || v === undefined)) {
    throw new Error('One or more dropdown values are invalid');
  }

  const unmitigatedRrn = f * s * p * np;
  const mitigatedRrn = unmitigatedRrn * c;
  const isValid = Number(body.effective) === 1 && Number(body.independent) === 1 && Number(body.auditable) === 1;

  return {
    p_value: p,
    f_value: f,
    s_value: s,
    np_value: np,
    c_value: c,
    unmitigated_rrn: unmitigatedRrn,
    unmitigated_risk_level: riskLevelForRRN(unmitigatedRrn),
    mitigated_rrn: mitigatedRrn,
    mitigated_risk_level: riskLevelForRRN(mitigatedRrn),
    valid_status: isValid ? 'Valid' : 'Not valid'
  };
}

const FIELDS = [
  'assessment_date', 'department', 'area', 'area_other', 'team_members', 'sub_area',
  'job_task', 'sub_task', 'routine', 'activity_type', 'hazard', 'hazard_other',
  'hazard_description', 'probability', 'frequency', 'severity', 'people_exposed',
  'control_measure_description', 'effective', 'independent', 'auditable', 'control_measure'
];

router.get('/', (req, res) => {
  const { department, risk_level, from, to, search } = req.query;
  let sql = 'SELECT * FROM assessments WHERE 1=1';
  const params = [];
  if (department) {
    sql += ' AND department = ?';
    params.push(department);
  }
  if (risk_level) {
    sql += ' AND mitigated_risk_level = ?';
    params.push(risk_level);
  }
  if (from) {
    sql += ' AND assessment_date >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND assessment_date <= ?';
    params.push(to);
  }
  if (search) {
    sql += ' AND (job_task LIKE ? OR sub_task LIKE ? OR hazard LIKE ? OR area LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  sql += ' ORDER BY assessment_date DESC, id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', upload.single('hazard_photo'), (req, res) => {
  try {
    const derived = computeDerived(req.body);
    const values = FIELDS.map((f) => req.body[f] ?? null);
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const stmt = db.prepare(`
      INSERT INTO assessments (
        ${FIELDS.join(', ')}, hazard_photo_path,
        p_value, f_value, s_value, np_value, c_value,
        unmitigated_rrn, unmitigated_risk_level, mitigated_rrn, mitigated_risk_level, valid_status,
        created_by
      ) VALUES (
        ${FIELDS.map(() => '?').join(', ')}, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?
      )
    `);
    const info = stmt.run(
      ...values, photoPath,
      derived.p_value, derived.f_value, derived.s_value, derived.np_value, derived.c_value,
      derived.unmitigated_rrn, derived.unmitigated_risk_level, derived.mitigated_rrn, derived.mitigated_risk_level, derived.valid_status,
      req.user.id
    );
    const created = db.prepare('SELECT * FROM assessments WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', upload.single('hazard_photo'), (req, res) => {
  const existing = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  try {
    const derived = computeDerived(req.body);
    const photoPath = req.file ? `/uploads/${req.file.filename}` : existing.hazard_photo_path;

    if (req.file && existing.hazard_photo_path) {
      const oldPath = path.join(uploadsDir, path.basename(existing.hazard_photo_path));
      fs.unlink(oldPath, () => {});
    }

    const setClause = FIELDS.map((f) => `${f} = ?`).join(', ');
    const stmt = db.prepare(`
      UPDATE assessments SET
        ${setClause}, hazard_photo_path = ?,
        p_value = ?, f_value = ?, s_value = ?, np_value = ?, c_value = ?,
        unmitigated_rrn = ?, unmitigated_risk_level = ?, mitigated_rrn = ?, mitigated_risk_level = ?, valid_status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `);
    const values = FIELDS.map((f) => req.body[f] ?? null);
    stmt.run(
      ...values, photoPath,
      derived.p_value, derived.f_value, derived.s_value, derived.np_value, derived.c_value,
      derived.unmitigated_rrn, derived.unmitigated_risk_level, derived.mitigated_rrn, derived.mitigated_risk_level, derived.valid_status,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.hazard_photo_path) {
    fs.unlink(path.join(uploadsDir, path.basename(existing.hazard_photo_path)), () => {});
  }
  db.prepare('DELETE FROM assessments WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
