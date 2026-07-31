import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Select from '../components/Select.jsx';
import { DEPARTMENTS, RISK_LEVEL_STATUS } from '../constants.js';

const yesNo = (v) => (v === 1 ? 'Yes' : 'No');
const resolved = (value, other) => (value === 'Other (To specify)' ? (other || 'Other') : value);

export default function SheetView({ isPublic = false }) {
  const [rows, setRows] = useState([]);
  const [department, setDepartment] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const fetcher = isPublic ? api.publicAssessments : api.listAssessments;
    fetcher({ department, search })
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [department, search]);

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="sheet-view">
      <div className="dashboard-header">
        <h1>Risk Register — Full Sheet View{isPublic ? ' (Public, view-only)' : ''}</h1>
        <Link to={isPublic ? '/login' : '/dashboard'} className="btn-ghost">{isPublic ? 'Log In' : 'Back to Dashboard'}</Link>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h2>All Fields ({rows.length})</h2>
          <div className="filters">
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              className="filter-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              options={[{ value: '', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]}
            />
          </div>
        </div>

        {loading ? (
          <div className="page-loading">Loading…</div>
        ) : (
          <div className="table-scroll table-scroll-sticky">
            <table className="table-dense">
              <thead>
                <tr>
                  <th>S</th>
                  <th>Date</th>
                  <th>Department</th>
                  <th>Area</th>
                  <th>Sub Area</th>
                  <th>Job/Task</th>
                  <th>Sub Task</th>
                  <th>Routine</th>
                  <th>Activity Type</th>
                  <th>Hazard</th>
                  <th>Hazard Description</th>
                  <th>Probability</th>
                  <th>P</th>
                  <th>Severity</th>
                  <th>S</th>
                  <th>Frequency</th>
                  <th>F</th>
                  <th>People Exposed</th>
                  <th>NP</th>
                  <th>Unmitigated RRN</th>
                  <th>Unmitigated Risk Level</th>
                  <th>Control Measure Description</th>
                  <th>Effective</th>
                  <th>Independent</th>
                  <th>Auditable</th>
                  <th>Valid / Not Valid</th>
                  <th>Control Measure</th>
                  <th>C</th>
                  <th>Mitigated RRN</th>
                  <th>Mitigated Risk Level</th>
                  <th>Immediate Action Plan</th>
                  <th>Team Members</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.assessment_date}</td>
                    <td>{r.department}</td>
                    <td>{resolved(r.area, r.area_other)}</td>
                    <td>{r.sub_area}</td>
                    <td>{r.job_task}</td>
                    <td>{r.sub_task}</td>
                    <td>{r.routine}</td>
                    <td>{r.activity_type}</td>
                    <td>{resolved(r.hazard, r.hazard_other)}</td>
                    <td className="wrap-cell">{r.hazard_description}</td>
                    <td className="wrap-cell">{r.probability}</td>
                    <td>{r.p_value}</td>
                    <td className="wrap-cell">{r.severity}</td>
                    <td>{r.s_value}</td>
                    <td className="wrap-cell">{r.frequency}</td>
                    <td>{r.f_value}</td>
                    <td>{r.people_exposed}</td>
                    <td>{r.np_value}</td>
                    <td>{r.unmitigated_rrn.toFixed(2)}</td>
                    <td>
                      <span className={`level-pill status-${RISK_LEVEL_STATUS[r.unmitigated_risk_level] || 'good'}`}>
                        <span className="level-dot" />{r.unmitigated_risk_level}
                      </span>
                    </td>
                    <td className="wrap-cell">{r.control_measure_description}</td>
                    <td>{yesNo(r.effective)}</td>
                    <td>{yesNo(r.independent)}</td>
                    <td>{yesNo(r.auditable)}</td>
                    <td>{r.valid_status}</td>
                    <td className="wrap-cell">{r.control_measure}</td>
                    <td>{r.c_value}</td>
                    <td>{r.mitigated_rrn.toFixed(2)}</td>
                    <td>
                      <span className={`level-pill status-${RISK_LEVEL_STATUS[r.mitigated_risk_level] || 'good'}`}>
                        <span className="level-dot" />{r.mitigated_risk_level}
                      </span>
                    </td>
                    <td className="wrap-cell">{r.immediate_action_plan || '—'}</td>
                    <td className="wrap-cell">{r.team_members}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={31} className="empty-state">No assessments match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
