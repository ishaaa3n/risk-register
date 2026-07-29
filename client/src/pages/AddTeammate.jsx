import { useState } from 'react';
import { api } from '../api.js';

export default function AddTeammate() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.addTeammate(form.name, form.email, form.password);
      setSuccess(`Account created for ${form.email}. Share the password with them directly.`);
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-page">
      <form onSubmit={submit} className="risk-form" style={{ maxWidth: 420 }}>
        <div className="form-header">
          <h1>Add Teammate</h1>
          <p className="muted">Create a login for someone else on your team. Anyone with an account can add or edit assessments.</p>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
        </div>

        <section className="form-section">
          <label>
            Name *
            <input type="text" value={form.name} onChange={update('name')} required />
          </label>
          <label>
            Email *
            <input type="email" value={form.email} onChange={update('email')} required />
          </label>
          <label>
            Temporary Password * <span className="hint">at least 8 characters</span>
            <input type="password" value={form.password} onChange={update('password')} minLength={8} required />
          </label>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
