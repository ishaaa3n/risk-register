import { Router } from 'express';
import pool from '../db.js';

// Intentionally has no requireAuth — this is the public, view-only mirror of
// GET /api/assessments. Read-only by construction: no POST/PUT/DELETE here.
const router = Router();

router.get('/assessments', async (req, res, next) => {
  try {
    const { department, risk_level, from, to, search, area, valid_status } = req.query;
    let sql = 'SELECT * FROM assessments WHERE 1=1';
    const params = [];
    if (department) {
      params.push(department);
      sql += ` AND department = $${params.length}`;
    }
    if (area) {
      params.push(area);
      sql += ` AND area = $${params.length}`;
    }
    if (risk_level) {
      params.push(risk_level);
      sql += ` AND mitigated_risk_level = $${params.length}`;
    }
    if (valid_status) {
      params.push(valid_status);
      sql += ` AND valid_status = $${params.length}`;
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

export default router;
