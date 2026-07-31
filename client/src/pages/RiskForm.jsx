import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, resolveUploadUrl } from '../api.js';
import {
  DEPARTMENTS, AREAS_BY_DEPARTMENT, ROUTINE_OPTIONS, ACTIVITY_TYPE_OPTIONS,
  HAZARD_OPTIONS, PROBABILITY_OPTIONS, FREQUENCY_OPTIONS, SEVERITY_OPTIONS,
  PEOPLE_EXPOSED_OPTIONS, CONTROL_MEASURE_OPTIONS, riskLevelForRRN, lookupValue,
  RISK_LEVEL_STATUS
} from '../constants.js';

const OTHER = 'Other (To specify)';
const today = () => new Date().toISOString().slice(0, 10);

const CRITERIA = [
  { field: 'effective', label: 'Effective', icon: '🛡' },
  { field: 'independent', label: 'Independent', icon: '🔒' },
  { field: 'auditable', label: 'Auditable', icon: '📋' }
];

const initialState = {
  assessment_date: today(),
  department: '',
  area: '',
  area_other: '',
  team_members: '',
  sub_area: '',
  job_task: '',
  sub_task: '',
  routine: '',
  activity_type: '',
  hazard: '',
  hazard_other: '',
  hazard_description: '',
  probability: '',
  frequency: '',
  severity: '',
  people_exposed: '',
  control_measure_description: '',
  effective: null,
  independent: null,
  auditable: null,
  control_measure: '',
  immediate_action_plan: ''
};

const ACTION_PLAN_THRESHOLD = 50;

const STATUS_DOT = { good: '🟢', warning: '🟡', serious: '🟠', critical: '🔴', neutral: '⚪' };

function RiskSummaryCard({ title, formula, rrn, level }) {
  const ready = Number.isFinite(rrn);
  const status = ready ? (RISK_LEVEL_STATUS[level] || 'good') : 'neutral';
  return (
    <div className={`summary-card status-${status}`}>
      <div className="summary-card-title">{title}</div>
      <div className="summary-row">
        <span className="summary-key">Formula</span>
        <span className="summary-val muted">{formula}</span>
      </div>
      <div className="summary-row">
        <span className="summary-key">Current Value</span>
        <span className="summary-val big">{ready ? rrn.toFixed(2) : '—'}</span>
      </div>
      <div className="summary-row">
        <span className="summary-key">Status</span>
        <span className="summary-val">{STATUS_DOT[status]} {ready ? level : 'Awaiting Inputs'}</span>
      </div>
    </div>
  );
}

function CriterionToggle({ icon, label, value, onChange, invalid }) {
  return (
    <div className={`criterion-row ${invalid ? 'criterion-invalid' : ''}`}>
      <div className="criterion-label"><span className="criterion-icon">{icon}</span>{label} *</div>
      <div className="segmented" role="group" aria-label={label}>
        <button
          type="button"
          className={`seg-btn ${value === 1 ? 'seg-yes-active' : ''}`}
          aria-pressed={value === 1}
          onClick={() => onChange(1)}
        >
          Yes
        </button>
        <button
          type="button"
          className={`seg-btn ${value === 0 ? 'seg-no-active' : ''}`}
          aria-pressed={value === 0}
          onClick={() => onChange(0)}
        >
          No
        </button>
      </div>
    </div>
  );
}

export default function RiskForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [photo, setPhoto] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.getAssessment(id).then((row) => {
      setForm({
        assessment_date: row.assessment_date,
        department: row.department,
        area: row.area,
        area_other: row.area_other || '',
        team_members: row.team_members || '',
        sub_area: row.sub_area || '',
        job_task: row.job_task || '',
        sub_task: row.sub_task || '',
        routine: row.routine,
        activity_type: row.activity_type,
        hazard: row.hazard,
        hazard_other: row.hazard_other || '',
        hazard_description: row.hazard_description || '',
        probability: row.probability,
        frequency: row.frequency,
        severity: row.severity,
        people_exposed: row.people_exposed,
        control_measure_description: row.control_measure_description || '',
        effective: row.effective,
        independent: row.independent,
        auditable: row.auditable,
        control_measure: row.control_measure,
        immediate_action_plan: row.immediate_action_plan || ''
      });
      setExistingPhotoUrl(row.hazard_photo_path);
      setLoading(false);
    }).catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, [id]);

  const areaOptions = form.department ? AREAS_BY_DEPARTMENT[form.department] || [] : [];

  const derived = useMemo(() => {
    const p = lookupValue(PROBABILITY_OPTIONS, form.probability);
    const f = lookupValue(FREQUENCY_OPTIONS, form.frequency);
    const s = lookupValue(SEVERITY_OPTIONS, form.severity);
    const np = lookupValue(PEOPLE_EXPOSED_OPTIONS, form.people_exposed);
    const c = lookupValue(CONTROL_MEASURE_OPTIONS, form.control_measure);

    const ready = [p, f, s, np].every((v) => v !== null);
    const unmitigatedRrn = ready ? f * s * p * np : NaN;
    const unmitigatedLevel = ready ? riskLevelForRRN(unmitigatedRrn) : '';

    const mitigatedReady = ready && c !== null;
    const mitigatedRrn = mitigatedReady ? unmitigatedRrn * c : NaN;
    const mitigatedLevel = mitigatedReady ? riskLevelForRRN(mitigatedRrn) : '';

    const allAnswered = [form.effective, form.independent, form.auditable].every((v) => v === 0 || v === 1);
    const satisfiedCount = [form.effective, form.independent, form.auditable].filter((v) => v === 1).length;
    const isValid = allAnswered && satisfiedCount === 3;

    return {
      unmitigatedRrn, unmitigatedLevel, mitigatedRrn, mitigatedLevel,
      allAnswered, satisfiedCount,
      validStatus: allAnswered ? (isValid ? 'Valid' : 'Not valid') : null
    };
  }, [form]);

  const update = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const setCriterion = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const missingCriteria = CRITERIA.some(({ field }) => form[field] !== 0 && form[field] !== 1);
    if (missingCriteria) {
      setAttemptedSubmit(true);
      setError('Please answer Effective, Independent and Auditable before submitting.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('hazard_photo', photo);

      if (isEdit) {
        await api.updateAssessment(id, fd);
      } else {
        await api.createAssessment(fd);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="form-page">
      <form onSubmit={submit} className="risk-form">
        <div className="form-header">
          <h1>{isEdit ? 'Edit Risk Assessment' : 'New Risk Assessment'}</h1>
          {error && <div className="alert alert-error">{error}</div>}
        </div>

        <section className="form-section">
          <h2>1. Assessment Details</h2>
          <div className="grid-2">
            <label>
              Assessment Date *
              <input type="date" value={form.assessment_date} onChange={update('assessment_date')} required />
            </label>
            <label>
              Department *
              <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value, area: '' }))} required>
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label>
              Area *
              <select value={form.area} onChange={update('area')} required disabled={!form.department}>
                <option value="">Select area…</option>
                {areaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            {form.area === OTHER && (
              <label>
                Specify Area *
                <input type="text" value={form.area_other} onChange={update('area_other')} required />
              </label>
            )}
            <label>
              Sub Area *
              <input type="text" value={form.sub_area} onChange={update('sub_area')} required />
            </label>
          </div>
          <label>
            Assessment Team Members * <span className="hint">one per line</span>
            <textarea rows={3} value={form.team_members} onChange={update('team_members')} required />
          </label>
        </section>

        <section className="form-section">
          <h2>2. Job / Task</h2>
          <div className="grid-2">
            <label>
              Job/Task *
              <input type="text" value={form.job_task} onChange={update('job_task')} required />
            </label>
            <label>
              Sub Task *
              <input type="text" value={form.sub_task} onChange={update('sub_task')} required />
            </label>
            <label>
              Routine / Non-Routine *
              <select value={form.routine} onChange={update('routine')} required>
                <option value="">Select…</option>
                {ROUTINE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label>
              Type of Activity *
              <select value={form.activity_type} onChange={update('activity_type')} required>
                <option value="">Select…</option>
                {ACTIVITY_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2>3. Hazard</h2>
          <div className="grid-2">
            <label>
              Hazard *
              <select value={form.hazard} onChange={update('hazard')} required>
                <option value="">Select hazard…</option>
                {HAZARD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            {form.hazard === OTHER && (
              <label>
                Specify Hazard *
                <input type="text" value={form.hazard_other} onChange={update('hazard_other')} required />
              </label>
            )}
            <label>
              Hazard Photo <span className="hint">jpg, png or pdf</span>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={(e) => setPhoto(e.target.files[0] || null)} />
            </label>
          </div>
          {existingPhotoUrl && !photo && (
            <div className="existing-photo">
              Current file: <a href={resolveUploadUrl(existingPhotoUrl)} target="_blank" rel="noreferrer">view attachment</a>
            </div>
          )}
          <label>
            Hazard Description *
            <textarea rows={2} value={form.hazard_description} onChange={update('hazard_description')} required />
          </label>
        </section>

        <section className="form-section">
          <h2>4. Unmitigated Risk Rating</h2>
          <div className="grid-4">
            <label>
              Probability *
              <select value={form.probability} onChange={update('probability')} required>
                <option value="">Select…</option>
                {PROBABILITY_OPTIONS.map((o) => <option key={o.label} value={o.label}>{o.label} (P={o.value})</option>)}
              </select>
            </label>
            <label>
              Frequency *
              <select value={form.frequency} onChange={update('frequency')} required>
                <option value="">Select…</option>
                {FREQUENCY_OPTIONS.map((o) => <option key={o.label} value={o.label}>{o.label} (F={o.value})</option>)}
              </select>
            </label>
            <label>
              Severity *
              <select value={form.severity} onChange={update('severity')} required>
                <option value="">Select…</option>
                {SEVERITY_OPTIONS.map((o) => <option key={o.label} value={o.label}>{o.label} (S={o.value})</option>)}
              </select>
            </label>
            <label>
              No. of People Exposed *
              <select value={form.people_exposed} onChange={update('people_exposed')} required>
                <option value="">Select…</option>
                {PEOPLE_EXPOSED_OPTIONS.map((o) => <option key={o.label} value={o.label}>{o.label} (NP={o.value})</option>)}
              </select>
            </label>
          </div>
          <RiskSummaryCard title="Unmitigated Risk" formula="F × S × P × NP" rrn={derived.unmitigatedRrn} level={derived.unmitigatedLevel} />
        </section>

        <section className="form-section">
          <h2>5. Control Measures</h2>
          <label>
            Describe Control Measure *
            <textarea
              rows={2}
              value={form.control_measure_description}
              onChange={update('control_measure_description')}
              placeholder="Example: Monthly review of privileged access logs performed by the security team."
              required
            />
          </label>

          <div className="subsection-heading">Validation Criteria</div>
          <div className="criteria-list">
            {CRITERIA.map(({ field, label, icon }) => (
              <CriterionToggle
                key={field}
                icon={icon}
                label={label}
                value={form[field]}
                onChange={setCriterion(field)}
                invalid={attemptedSubmit && form[field] !== 0 && form[field] !== 1}
              />
            ))}
          </div>

          <div className="criteria-progress">
            {CRITERIA.map(({ field, label }) => (
              <span key={field} className={`item ${form[field] === 1 ? 'satisfied' : 'unsatisfied'}`}>
                {form[field] === 1 ? '✓' : form[field] === 0 ? '✗' : '○'} {label}
              </span>
            ))}
            <span className="count">{derived.satisfiedCount} / 3 requirements satisfied</span>
          </div>

          {derived.validStatus === null && (
            <div className="valid-hint">
              ⚠ To validate this control, Effective, Independent and Auditable must all be Yes.
            </div>
          )}
          {derived.validStatus === 'Valid' && (
            <div className="valid-chip status-good">Valid — all criteria satisfied.</div>
          )}
          {derived.validStatus === 'Not valid' && (
            <div className="valid-chip status-warning">Not valid — not all criteria are satisfied yet.</div>
          )}

          <label>
            Control Measure Category *
            <select value={form.control_measure} onChange={update('control_measure')} required>
              <option value="">Choose a control category</option>
              {CONTROL_MEASURE_OPTIONS.map((o) => <option key={o.label} value={o.label}>{o.label} (C={o.value})</option>)}
            </select>
          </label>

          <div className="section-divider" />

          <RiskSummaryCard title="Mitigated Risk" formula="Unmitigated RRN × Control Factor" rrn={derived.mitigatedRrn} level={derived.mitigatedLevel} />
        </section>

        {derived.mitigatedRrn > ACTION_PLAN_THRESHOLD && (
          <section className="form-section action-plan-section">
            <h2>6. Immediate Action Plan</h2>
            <p className="action-plan-hint">
              ⚠ Mitigated Risk Score is {derived.mitigatedRrn.toFixed(2)}, above the {ACTION_PLAN_THRESHOLD} threshold.
              Describe the immediate action plan for this risk before it can be submitted.
            </p>
            <label>
              Immediate Action Plan *
              <textarea
                rows={3}
                value={form.immediate_action_plan}
                onChange={update('immediate_action_plan')}
                placeholder="Example: Stop the task, isolate the equipment, and notify the shift supervisor within 24 hours."
                required
              />
            </label>
          </section>
        )}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={() => navigate('/dashboard')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}
