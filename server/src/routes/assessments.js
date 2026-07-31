import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pool from '../db.js';
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
// Local disk only — not backed by a persistent volume, so uploaded photos can
// be lost on redeploy/restart. Assessment data itself lives in Postgres.
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
const INTEGER_FIELDS = new Set(['effective', 'independent', 'auditable']);

function fieldValues(body) {
  return FIELDS.map((f) => {
    const v = body[f] ?? null;
    return INTEGER_FIELDS.has(f) && v !== null ? Number(v) : v;
  });
}

router.get('/', async (req, res, next) => {
  try {
    const { department, risk_level, from, to, search } = req.query;
    let sql = 'SELECT * FROM assessments WHERE 1=1';
    const params = [];
    if (department) {
      params.push(department);
      sql += ` AND department = $${params.length}`;
    }
    if (risk_level) {
      params.push(risk_level);
      sql += ` AND mitigated_risk_level = $${params.length}`;
    }
    if (from) {
      params.push(from);
      sql += ` AND assessment_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      sql += ` AND assessment_date <= $${params.length}`;
    }
    if (search) {
      const term = `%${search}%`;
      params.push(term, term, term, term);
      const [a, b, c, d] = [params.length - 3, params.length - 2, params.length - 1, params.length];
      sql += ` AND (job_task ILIKE $${a} OR sub_task ILIKE $${b} OR hazard ILIKE $${c} OR area ILIKE $${d})`;
    }
    sql += ' ORDER BY assessment_date DESC, id DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', upload.single('hazard_photo'), async (req, res) => {
  try {
    const derived = computeDerived(req.body);
    const values = fieldValues(req.body);
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const insertFields = [
      ...FIELDS, 'hazard_photo_path',
      'p_value', 'f_value', 's_value', 'np_value', 'c_value',
      'unmitigated_rrn', 'unmitigated_risk_level', 'mitigated_rrn', 'mitigated_risk_level', 'valid_status',
      'created_by'
    ];
    const allValues = [
      ...values, photoPath,
      derived.p_value, derived.f_value, derived.s_value, derived.np_value, derived.c_value,
      derived.unmitigated_rrn, derived.unmitigated_risk_level, derived.mitigated_rrn, derived.mitigated_risk_level, derived.valid_status,
      req.user.id
    ];
    const placeholders = insertFields.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO assessments (${insertFields.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    const { rows } = await pool.query(sql, allValues);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', upload.single('hazard_photo'), async (req, res) => {
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const derived = computeDerived(req.body);
    const photoPath = req.file ? `/uploads/${req.file.filename}` : existing.hazard_photo_path;

    if (req.file && existing.hazard_photo_path) {
      const oldPath = path.join(uploadsDir, path.basename(existing.hazard_photo_path));
      fs.unlink(oldPath, () => {});
    }

    const values = fieldValues(req.body);
    const setFields = [
      ...FIELDS, 'hazard_photo_path',
      'p_value', 'f_value', 's_value', 'np_value', 'c_value',
      'unmitigated_rrn', 'unmitigated_risk_level', 'mitigated_rrn', 'mitigated_risk_level', 'valid_status'
    ];
    const setValues = [
      ...values, photoPath,
      derived.p_value, derived.f_value, derived.s_value, derived.np_value, derived.c_value,
      derived.unmitigated_rrn, derived.unmitigated_risk_level, derived.mitigated_rrn, derived.mitigated_risk_level, derived.valid_status
    ];
    const setClause = setFields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const idParam = setValues.length + 1;
    const sql = `UPDATE assessments SET ${setClause}, updated_at = now() WHERE id = $${idParam} RETURNING *`;

    const { rows } = await pool.query(sql, [...setValues, req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: existingRows } = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.hazard_photo_path) {
      fs.unlink(path.join(uploadsDir, path.basename(existing.hazard_photo_path)), () => {});
    }
    await pool.query('DELETE FROM assessments WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
