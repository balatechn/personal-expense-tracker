const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── Auth ─────────────────────────────────────────────────
export const auth = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  me:       ()     => request('/auth/me'),
};

// ── Expenses ─────────────────────────────────────────────
export const expenses = {
  list:    (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/expenses${qs ? `?${qs}` : ''}`);
  },
  get:     (id)        => request(`/expenses/${id}`),
  create:  (body)      => request('/expenses', { method: 'POST', body: JSON.stringify(body) }),
  update:  (id, body)  => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete:  (id)        => request(`/expenses/${id}`, { method: 'DELETE' }),
  summary: (period)    => request(`/expenses/stats/summary?period=${period || 'month'}`),
};

// ── Categories ───────────────────────────────────────────
export const categories = {
  list:    ()     => request('/categories'),
  create:  (body) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
  delete:  (id)   => request(`/categories/${id}`, { method: 'DELETE' }),
  suggest: (text) => request(`/categories/suggest?text=${encodeURIComponent(text)}`),
};

// ── Budgets ──────────────────────────────────────────────
export const budgets = {
  list:   ()     => request('/budgets'),
  set:    (body) => request('/budgets', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id)   => request(`/budgets/${id}`, { method: 'DELETE' }),
};
