// Client de l'API de synchronisation Convention Paris 2026.
// L'URL du serveur est fournie au build via VITE_API_URL (voir .env).
// Si elle est absente ou si une requête échoue, l'app bascule en mode local (hors-ligne).

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_ENABLED = Boolean(API_URL);

const TOKENS = { participant: 'p26_srv_token', admin: 'p26_admin_token' };

export const getParticipantToken = () => localStorage.getItem(TOKENS.participant);
export const setParticipantToken = (t) => localStorage.setItem(TOKENS.participant, t);
export const getAdminToken = () => localStorage.getItem(TOKENS.admin);
export const setAdminToken = (t) => localStorage.setItem(TOKENS.admin, t);
export const clearAdminToken = () => localStorage.removeItem(TOKENS.admin);

async function apiFetch(path, { method = 'GET', body, auth } = {}) {
  if (!API_ENABLED) throw new Error('api_disabled');
  const headers = { 'Content-Type': 'application/json' };
  if (auth === 'participant') {
    const t = getParticipantToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  } else if (auth === 'admin') {
    const t = getAdminToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = new Error(`api_error_${res.status}`);
    err.status = res.status;
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

export const submitQuestionApi = (text) =>
  apiFetch('/api/questions', { method: 'POST', body: { text }, auth: 'participant' });

export const fetchMyQuestions = () =>
  apiFetch('/api/questions/mine', { auth: 'participant' });

// ---- Admin ----
export async function adminLogin(code) {
  const data = await apiFetch('/api/admin/login', { method: 'POST', body: { code } });
  if (data?.token) setAdminToken(data.token);
  return data;
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

// ---- Pellicule (photos partagées) ----
export const fetchPhotos = () => apiFetch('/api/photos', { auth: 'participant' });

export async function uploadPhoto(blob) {
  if (!API_ENABLED) throw new Error('api_disabled');
  const form = new FormData();
  form.append('photo', blob, 'photo.jpg');
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
