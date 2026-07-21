// Client de l'API de synchronisation Convention Paris 2026.
// L'URL du serveur est fournie au build via VITE_API_URL (voir .env).
// Si elle est absente ou si une requête échoue, l'app bascule en mode local (hors-ligne).

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_ENABLED = Boolean(API_URL);

const TOKENS = { participant: 'p26_srv_token', admin: 'p26_admin_token' };

export const getParticipantToken = () => localStorage.getItem(TOKENS.participant);
export const setParticipantToken = (t) => localStorage.setItem(TOKENS.participant, t);
export const clearParticipantToken = () => localStorage.removeItem(TOKENS.participant);
// Un jeton administrateur ne doit pas survivre à la fermeture de l'application.
export const getAdminToken = () => sessionStorage.getItem(TOKENS.admin);
export const setAdminToken = (t) => sessionStorage.setItem(TOKENS.admin, t);
export const clearAdminToken = () => sessionStorage.removeItem(TOKENS.admin);

async function apiFetch(path, { method = 'GET', body, auth, timeoutMs = 10000 } = {}) {
  if (!API_ENABLED) throw new Error('api_disabled');
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth === 'participant') {
    const t = getParticipantToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  } else if (auth === 'admin') {
    const t = getAdminToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    let payload = null;
    try { payload = await res.json(); } catch { /* réponse non JSON */ }
    const err = new Error(payload?.error || `api_error_${res.status}`);
    err.status = res.status;
    err.code = payload?.error;
    throw err;
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : null;
}

// ---- Participant ----
export async function registerParticipant(profile) {
  const data = await apiFetch('/api/participants', {
    method: 'POST',
    body: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      country: profile.country,
    },
  });
  if (data?.token) setParticipantToken(data.token);
  return data;
}

export const fetchMyProfile = () =>
  apiFetch('/api/participants/me', { auth: 'participant' });

export const submitQuestionApi = (text, consent) =>
  apiFetch('/api/questions', { method: 'POST', body: { text, consent }, auth: 'participant' });

export const fetchMyQuestions = () =>
  apiFetch('/api/questions/mine', { auth: 'participant' });

// ---- Admin ----
export async function adminLogin(code) {
  const data = await apiFetch('/api/admin/login', { method: 'POST', body: { code } });
  if (data?.token) setAdminToken(data.token);
  return data;
}

export async function adminLogout() {
  try {
    await apiFetch('/api/admin/logout', { method: 'POST', auth: 'admin' });
  } finally {
    clearAdminToken();
  }
}

export const fetchAdminQuestions = () =>
  apiFetch('/api/admin/questions', { auth: 'admin' });

export const assignQuestionApi = (id, payload) =>
  apiFetch(`/api/admin/questions/${id}/assign`, { method: 'POST', body: payload, auth: 'admin' });

export const fetchAdminStats = () =>
  apiFetch('/api/admin/stats', { auth: 'admin' });

// ---- Contenu éditable & notifications (lecture publique) ----
export const fetchContent = () => apiFetch('/api/content');
export const fetchNotifications = () => apiFetch('/api/notifications');

// ---- Hébergement assigné (personnes prises en charge par l'organisation) ----
export const fetchMyHousing = () =>
  apiFetch('/api/participants/me/housing', { auth: 'participant' });

export async function deleteMyAccount() {
  const result = await apiFetch('/api/participants/me', { method: 'DELETE', auth: 'participant' });
  clearParticipantToken();
  return result;
}

// ---- Pellicule (photos partagées) ----
export const fetchPhotos = () => apiFetch('/api/photos', { auth: 'participant' });

export async function uploadPhoto(blob) {
  if (!API_ENABLED) throw new Error('api_disabled');
  const form = new FormData();
  form.append('photo', blob, 'photo.jpg');
  form.append('consent', 'true');
  const res = await fetch(`${API_URL}/api/photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getParticipantToken()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`api_error_${res.status}`);
  return res.json();
}

// URL absolue d'un média servi par le backend (/media/xxx)
export const mediaUrl = (path) =>
  path && path.startsWith('/') ? `${API_URL}${path}` : (path || '');
