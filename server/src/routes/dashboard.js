import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { DEPARTMENTS } from '../constants.js';

const router = Router();
router.use(requireAuth);

const RISK_LEVEL_ORDER = [
  'Very Low',
  'Low',
  'Medium (acceptable)',
  'Medium (consider controls)',
  'High (consider stopping task and implement interim controls)',
  'Unacceptable (stop task and implement interim controls)'
];

router.get('/summary', async (req, res, next) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) AS n FROM assessments');
    const total = Number(totalResult.rows[0].n);

    const byMitigatedLevel = await pool.query(`
      SELECT mitigated_risk_level AS level, COUNT(*) AS count
      FROM assessments GROUP BY mitigated_risk_level
    `);
    const byMitigatedLevelMap = Object.fromEntries(byMitigatedLevel.rows.map((r) => [r.level, Number(r.count)]));
    const riskLevelDistribution = RISK_LEVEL_ORDER.map((level) => ({
      level,
      count: byMitigatedLevelMap[level] || 0
    }));

    const byDepartmentRows = await pool.query(`
      SELECT department, COUNT(*) AS count
      FROM assessments GROUP BY department
    `);
    const byDepartmentMap = Object.fromEntries(byDepartmentRows.rows.map((r) => [r.department, Number(r.count)]));
    const byDepartment = DEPARTMENTS.map((department) => ({
      department,
      count: byDepartmentMap[department] || 0
    }));

    const byHazardResult = await pool.query(`
      SELECT hazard, COUNT(*) AS count
      FROM assessments GROUP BY hazard ORDER BY count DESC LIMIT 8
    `);
    const byHazard = byHazardResult.rows.map((r) => ({ hazard: r.hazard, count: Number(r.count) }));

    const byMonthResult = await pool.query(`
      SELECT substr(assessment_date, 1, 7) AS month,
             COUNT(*) AS count,
             AVG(unmitigated_rrn) AS avg_unmitigated,
             AVG(mitigated_rrn) AS avg_mitigated
      FROM assessments
      GROUP BY month
      ORDER BY month ASC
    `);
    const byMonth = byMonthResult.rows.map((r) => ({
      month: r.month,
      count: Number(r.count),
      avg_unmitigated: Number(r.avg_unmitigated),
      avg_mitigated: Number(r.avg_mitigated)
    }));

    const highRiskResult = await pool.query(`
      SELECT COUNT(*) AS n FROM assessments
      WHERE mitigated_risk_level IN (
        'High (consider stopping task and implement interim controls)',
        'Unacceptable (stop task and implement interim controls)'
      )
    `);
    const highRiskOpen = Number(highRiskResult.rows[0].n);

    const notValidResult = await pool.query(`SELECT COUNT(*) AS n FROM assessments WHERE valid_status = 'Not valid'`);
    const notValidControls = Number(notValidResult.rows[0].n);

    const avgReductionResult = await pool.query(`
      SELECT AVG(CASE WHEN unmitigated_rrn > 0 THEN (unmitigated_rrn - mitigated_rrn) / unmitigated_rrn ELSE 0 END) AS avg
      FROM assessments
    `);
    const avgReduction = avgReductionResult.rows[0].avg !== null ? Number(avgReductionResult.rows[0].avg) : 0;

    res.json({
      total,
      highRiskOpen,
      notValidControls,
      avgReductionPct: avgReduction ? Math.round(avgReduction * 1000) / 10 : 0,
      riskLevelDistribution,
      byDepartment,
      byHazard,
      byMonth
    });
  } catch (err) {
    next(err);
  }
});

export default router;
