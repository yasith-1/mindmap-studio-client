// Thin fetch wrapper for the MapStudio backend. Owns the base URL, attaches
// the bearer token when signed in, and turns non-2xx JSON responses into
// thrown Errors carrying the server's message — so callers can just try/catch.
import { getToken } from './auth.js';

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no JSON body */
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // ── Auth (passwordless) ──────────────────────────────
  requestOtp: (email) => request('/auth/request-otp', { method: 'POST', body: { email } }),
  verifyOtp: (email, code) =>
    request('/auth/verify-otp', { method: 'POST', body: { email, code } }),
  me: () => request('/auth/me', { auth: true }),

  // ── Mind maps (cloud) ────────────────────────────────
  listMaps: () => request('/mindmaps', { auth: true }),
  createMap: (data) => request('/mindmaps', { method: 'POST', body: data, auth: true }),
  updateMap: (id, data) => request(`/mindmaps/${id}`, { method: 'PUT', body: data, auth: true }),
  deleteMap: (id) => request(`/mindmaps/${id}`, { method: 'DELETE', auth: true }),

  // ── Share links ──────────────────────────────────────
  // Owner (authenticated)
  createShare: (mapId, body) => request(`/mindmaps/${mapId}/share`, { method: 'POST', body, auth: true }),
  listShares: (mapId) => request(`/mindmaps/${mapId}/shares`, { auth: true }),
  revokeShare: (token) => request(`/shares/${token}`, { method: 'DELETE', auth: true }),
  // Public (no auth)
  getShareMeta: (token) => request(`/share/${token}`),
  openShare: (token, passcode) => request(`/share/${token}/open`, { method: 'POST', body: { passcode } }),
};
