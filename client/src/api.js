let token = localStorage.getItem('medflow_token') || null;

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('medflow_token', t);
  else localStorage.removeItem('medflow_token');
}
export function getToken() {
  return token;
}

export async function api(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: formData ? formData : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
