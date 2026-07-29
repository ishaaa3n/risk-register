import { Router } from 'express';
import db from '../db.js';
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

router.get('/summary', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS n FROM assessments').get().n;

  const byMitigatedLevel = db.prepare(`
    SELECT mitigated_risk_level AS level, COUNT(*) AS count
    FROM assessments GROUP BY mitigated_risk_level
  `).all();
  const byMitigatedLevelMap = Object.fromEntries(byMitigatedLevel.map((r) => [r.level, r.count]));
  const riskLevelDistribution = RISK_LEVEL_ORDER.map((level) => ({
    level,
    count: byMitigatedLevelMap[level] || 0
  }));

  const byDepartmentRows = db.prepare(`
    SELECT department, COUNT(*) AS count
    FROM assessments GROUP BY department
  `).all();
  const byDepartmentMap = Object.fromEntries(byDepartmentRows.map((r) => [r.department, r.count]));
  const byDepartment = DEPARTMENTS.map((department) => ({
    department,
    count: byDepartmentMap[department] || 0
  }));

  const byHazard = db.prepare(`
    SELECT hazard, COUNT(*) AS count
    FROM assessments GROUP BY hazard ORDER BY count DESC LIMIT 8
  `).all();

  const byMonth = db.prepare(`
    SELECT substr(assessment_date, 1, 7) AS month,
           COUNT(*) AS count,
           AVG(unmitigated_rrn) AS avg_unmitigated,
           AVG(mitigated_rrn) AS avg_mitigated
    FROM assessments
    GROUP BY month
    ORDER BY month ASC
  `).all();

  const highRiskOpen = db.prepare(`
    SELECT COUNT(*) AS n FROM assessments
    WHERE mitigated_risk_level IN (
      'High (consider stopping task and implement interim controls)',
      'Unacceptable (stop task and implement interim controls)'
    )
  `).get().n;

  const notValidControls = db.prepare(`SELECT COUNT(*) AS n FROM assessments WHERE valid_status = 'Not valid'`).get().n;

  const avgReduction = db.prepare(`
    SELECT AVG(CASE WHEN unmitigated_rrn > 0 THEN (unmitigated_rrn - mitigated_rrn) / unmitigated_rrn ELSE 0 END) AS avg
    FROM assessments
  `).get().avg;

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
});

export default router;
