import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Select from '../components/Select.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import TrendChart from '../components/charts/TrendChart.jsx';
import ColumnChart from '../components/charts/ColumnChart.jsx';
import { DEPARTMENTS, ALL_AREAS, RISK_LEVELS, VALID_STATUS_OPTIONS, RISK_LEVEL_STATUS } from '../constants.js';
import {
  ClipboardIcon, AlertTriangleIcon, ShieldAlertIcon, TrendingDownIcon, SearchIcon,
  Building2Icon, TriangleAlertIcon, EditIcon, TrashIcon
} from '../components/icons.jsx';

function StatTile({ label, value, status = 'info', icon: Icon }) {
  return (
    <div className={`stat-tile status-${status}`}>
      <div className={`stat-icon status-${status}`}><Icon /></div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function ActionRow({ icon: Icon, status, label, detail }) {
  return (
    <div className="action-row">
      <span className={`action-icon status-${status}`}><Icon /></span>
      <span className="action-label">{label}</span>
      <span className="action-detail">{detail}</span>
    </div>
  );
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="seg-toggle" role="tablist" aria-label="Chart view">
      <button
        type="button"
        role="tab"
        aria-selected={view === 'department'}
        className={`seg-toggle-btn ${view === 'department' ? 'active' : ''}`}
        onClick={() => onChange('department')}
      >
        <Building2Icon /> Department
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === 'hazards'}
        className={`seg-toggle-btn ${view === 'hazards' ? 'active' : ''}`}
        onClick={() => onChange('hazards')}
      >
        <TriangleAlertIcon /> Hazards
      </button>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ department: '', area: '', risk_level: '', valid_status: '', search: '' });
  const [chartView, setChartView] = useState('department');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSummary = () => api.dashboardSummary().then(setSummary).catch((e) => setError(e.message));
  const loadRows = () => api.listAssessments(filters).then(setRows).catch((e) => setError(e.message));

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSummary(), loadRows()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRows();
  }, [filters.department, filters.area, filters.risk_level, filters.valid_status, filters.search]);

  const remove = async (id) => {
    if (!window.confirm('Delete this risk assessment? This cannot be undone.')) return;
    await api.deleteAssessment(id);
    loadRows();
    loadSummary();
  };

  if (loading) return <div className="page-loading">Loading dashboard…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Risk Register Dashboard</h1>
        <Link to="/new" className="btn-primary">+ New Assessment</Link>
      </div>

      <div className="stat-grid">
        <StatTile label="Total Assessments" value={summary.total} status="info" icon={ClipboardIcon} />
        <StatTile
          label="High / Unacceptable Risk (open)"
          value={summary.highRiskOpen}
          status={summary.highRiskOpen > 0 ? 'critical' : 'good'}
          icon={AlertTriangleIcon}
        />
        <StatTile
          label="Controls Not Valid"
          value={summary.notValidControls}
          status={summary.notValidControls > 0 ? 'warning' : 'good'}
          icon={ShieldAlertIcon}
        />
        <StatTile label="Avg. Risk Reduction from Controls" value={`${summary.avgReductionPct}%`} status="good" icon={TrendingDownIcon} />
      </div>

      {(summary.highRiskOpen > 0 || summary.notValidControls > 0) && (
        <div className="action-card">
          <div className="action-card-title">Action Required</div>
          {summary.highRiskOpen > 0 && (
            <ActionRow
              icon={AlertTriangleIcon}
              status="critical"
              label="High / Unacceptable risk items open"
              detail={`${summary.highRiskOpen} assessment${summary.highRiskOpen === 1 ? '' : 's'}`}
            />
          )}
          {summary.notValidControls > 0 && (
            <ActionRow
              icon={ShieldAlertIcon}
              status="warning"
              label="Controls that don't meet all validity criteria"
              detail={`${summary.notValidControls} assessment${summary.notValidControls === 1 ? '' : 's'}`}
            />
          )}
          <ActionRow
            icon={TrendingDownIcon}
            status="good"
            label="Overall risk reduction from controls"
            detail={`${summary.avgReductionPct}% average`}
          />
        </div>
      )}

      <div className="chart-grid">
        <div className="chart-card">
          <h2>Mitigated Risk Level Distribution</h2>
          <BarChart
            data={summary.riskLevelDistribution}
            labelKey="level"
            valueKey="count"
            showPercent
            colorFor={(d) => `var(--status-${RISK_LEVEL_STATUS[d.level] || 'good'})`}
          />
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h2>{chartView === 'department' ? 'Assessments by Department' : 'Top Hazards'}</h2>
            <ViewToggle view={chartView} onChange={setChartView} />
          </div>
          {chartView === 'department' ? (
            <BarChart data={summary.byDepartment} labelKey="department" valueKey="count" compact />
          ) : (
            <BarChart data={summary.byHazard} labelKey="hazard" valueKey="count" compact />
          )}
        </div>

        <div className="chart-card">
          <h2>Average RRN Trend (Unmitigated vs Mitigated)</h2>
          <TrendChart
            data={summary.byMonth}
            series={[
              { key: 'avg_unmitigated', label: 'Unmitigated', color: 'var(--status-critical)' },
              { key: 'avg_mitigated', label: 'Mitigated', color: 'var(--status-good)' }
            ]}
          />
        </div>

        <div className="chart-card">
          <h2>Monthly Risk Assessment Count</h2>
          <ColumnChart data={summary.byMonth} valueKey="count" />
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h2>All Assessments</h2>
          <div className="filters">
            <div className="search-box">
              <SearchIcon className="search-icon" />
              <input
                type="search"
                placeholder="Search job, hazard, area…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            <Select
              className="filter-select"
              value={filters.department}
              onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
              options={[{ value: '', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]}
            />
            <Select
              className="filter-select"
              value={filters.area}
              onChange={(e) => setFilters((f) => ({ ...f, area: e.target.value }))}
              options={[{ value: '', label: 'All areas' }, ...ALL_AREAS.map((a) => ({ value: a, label: a }))]}
            />
            <Select
              className="filter-select"
              value={filters.risk_level}
              onChange={(e) => setFilters((f) => ({ ...f, risk_level: e.target.value }))}
              options={[{ value: '', label: 'All risk levels' }, ...RISK_LEVELS.map((l) => ({ value: l, label: l }))]}
            />
            <Select
              className="filter-select"
              value={filters.valid_status}
              onChange={(e) => setFilters((f) => ({ ...f, valid_status: e.target.value }))}
              options={[{ value: '', label: 'Valid + Not valid' }, ...VALID_STATUS_OPTIONS.map((v) => ({ value: v, label: v }))]}
            />
          </div>
        </div>
        <div className="table-scroll">
          <table className="assessments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Department</th>
                <th>Area</th>
                <th>Job/Task</th>
                <th>Hazard</th>
                <th>Unmitigated RRN</th>
                <th>Mitigated RRN</th>
                <th>Risk Level</th>
                <th>Valid</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.assessment_date}</td>
                  <td>{r.department}</td>
                  <td>{r.area === 'Other (To specify)' ? r.area_other : r.area}</td>
                  <td>{r.job_task}</td>
                  <td>{r.hazard === 'Other (To specify)' ? r.hazard_other : r.hazard}</td>
                  <td>{r.unmitigated_rrn.toFixed(2)}</td>
                  <td>{r.mitigated_rrn.toFixed(2)}</td>
                  <td>
                    <span className={`level-pill status-${RISK_LEVEL_STATUS[r.mitigated_risk_level] || 'good'}`}>
                      <span className="level-dot" />{r.mitigated_risk_level}
                    </span>
                  </td>
                  <td>{r.valid_status}</td>
                  <td>
                    <div className="row-actions">
                      <Link to={`/edit/${r.id}`} className="icon-btn" title="Edit" aria-label="Edit"><EditIcon /></Link>
                      <button className="icon-btn icon-btn-danger" title="Delete" aria-label="Delete" onClick={() => remove(r.id)}><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={10} className="empty-state">No assessments match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
