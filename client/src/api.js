// In dev, Vite proxies /api and /uploads to localhost:4000 (see vite.config.js), so
// leaving this blank keeps requests relative. In production (e.g. Vercel), the
// frontend and backend are deployed separately, so VITE_API_URL must point at the
// backend's public URL (e.g. https://your-api.onrender.com).
export const API_BASE = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'rr_token';
const USER_KEY = 'rr_user';

export function resolveUploadUrl(path) {
  if (!path) return path;
  return `${API_BASE}${path}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  if (res.status === 401) {
    clearSession();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  addTeammate: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  listAssessments: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/assessments${qs ? `?${qs}` : ''}`);
  },
  getAssessment: (id) => request(`/assessments/${id}`),
  createAssessment: (formData) => request('/assessments', { method: 'POST', body: formData }),
  updateAssessment: (id, formData) => request(`/assessments/${id}`, { method: 'PUT', body: formData }),
  deleteAssessment: (id) => request(`/assessments/${id}`, { method: 'DELETE' }),
  dashboardSummary: () => request('/dashboard/summary')
};
