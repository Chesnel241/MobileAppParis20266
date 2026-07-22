// Accès aux données via Supabase (Postgres + Storage), en remplacement de SQLite.
// Toutes les fonctions sont asynchrones. L'autorisation reste faite dans l'API :
// ici on ne fait que lire/écrire avec la clé service_role.
import { randomUUID } from 'node:crypto';
import { supabase, MEDIA_BUCKET, publicMediaUrl } from './supabase.js';
import { defaultContent, CONTENT_SECTIONS } from './defaults.js';
import { matchRegistration, housingFromRegistration } from './siteRegistry.js';

const nowIso = () => new Date().toISOString();

// --- Normalisation pour la liaison participant <-> logement ---
import { normPhone, normName } from './normalize.js';
export { normPhone, normName };

function must({ error }, ctx) {
  if (error) throw new Error(`[DB] ${ctx}: ${error.message}`);
}

// ---------------- Participants ----------------
export async function createParticipant({ firstName, lastName, phone, country, token }) {
  const id = randomUUID();
  const res = await supabase.from('participants').insert({
    id, token, first_name: firstName, last_name: lastName, phone, country, created_at: nowIso(),
  });
  must(res, 'createParticipant');
  await supabase.from('checkins').upsert({ participant_id: id, created_at: nowIso() }, { onConflict: 'participant_id' });
  return { id, token };
}

export async function participantByToken(token) {
  const { data, error } = await supabase.from('participants').select('*').eq('token', token).maybeSingle();
  if (error) throw new Error(`[DB] participantByToken: ${error.message}`);
  if (data) supabase.from('participants').update({ last_seen: nowIso() }).eq('id', data.id).then(() => {});
  return data || null;
}

export async function allParticipants() {
  const { data, error } = await supabase.from('participants').select('*');
  if (error) throw new Error(`[DB] allParticipants: ${error.message}`);
  return data || [];
}

// Suppression du compte et de toutes ses données (droit RGPD).
// Les questions, check-ins, abonnements push et photos partent en cascade ;
// les fichiers du Storage sont retirés explicitement.
export async function deleteParticipant(participantId) {
  const { data: photos } = await supabase.from('photos').select('file').eq('participant_id', participantId);
  const files = (photos || []).map(p => p.file);
  if (files.length) await supabase.storage.from(MEDIA_BUCKET).remove(files);
  // Le logement reste dans la liste de l'organisation, simplement délié.
  await supabase.from('housing').update({ participant_id: null, updated_at: nowIso() }).eq('participant_id', participantId);
  await supabase.from('participants').delete().eq('id', participantId);
}

export async function findDuplicateIdentity({ firstName, lastName, phone }) {
  const rows = await allParticipants();
  const key = normName(firstName) + '|' + normName(lastName) + '|' + normPhone(phone);
  return rows.some(p => (normName(p.first_name) + '|' + normName(p.last_name) + '|' + normPhone(p.phone)) === key);
}

// ---------------- Contenu ----------------
export async function seedContent() {
  const { data } = await supabase.from('content').select('section');
  const present = new Set((data || []).map(r => r.section));
  const missing = CONTENT_SECTIONS.filter(s => !present.has(s))
    .map(section => ({ section, data: defaultContent[section], updated_at: nowIso() }));
  if (missing.length) await supabase.from('content').insert(missing);
}

export async function getContent() {
  const { data, error } = await supabase.from('content').select('section, data');
  if (error) throw new Error(`[DB] getContent: ${error.message}`);
  const out = { ...defaultContent };
  for (const row of data || []) out[row.section] = row.data;
  return out;
}

export async function setContentSection(section, value) {
  const res = await supabase.from('content')
    .upsert({ section, data: value, updated_at: nowIso() }, { onConflict: 'section' });
  must(res, 'setContentSection');
}

// ---------------- Notifications ----------------
export async function createNotification({ fr, en }) {
  const id = randomUUID();
  const res = await supabase.from('notifications').insert({ id, text_fr: fr, text_en: en, created_at: nowIso() });
  must(res, 'createNotification');
  return { id, fr, en };
}

export async function recentNotifications(limit = 50) {
  const { data, error } = await supabase.from('notifications')
    .select('id, text_fr, text_en, created_at').order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(`[DB] recentNotifications: ${error.message}`);
  return (data || []).map(n => ({ id: n.id, fr: n.text_fr, en: n.text_en, createdAt: n.created_at }));
}

// ---------------- Questions ----------------
export async function createQuestion(participantId, text) {
  const id = randomUUID();
  const row = { id, participant_id: participantId, text, status: 'pending', created_at: nowIso(), updated_at: nowIso() };
  const res = await supabase.from('questions').insert(row);
  must(res, 'createQuestion');
  return serializeQuestionForParticipant(row);
}

export async function myQuestions(participantId) {
  const { data, error } = await supabase.from('questions').select('*')
    .eq('participant_id', participantId).order('created_at', { ascending: false });
  if (error) throw new Error(`[DB] myQuestions: ${error.message}`);
  return (data || []).map(serializeQuestionForParticipant);
}

export async function adminQuestions() {
  const { data, error } = await supabase.from('questions')
    .select('*, participants(first_name, last_name)').order('created_at', { ascending: false });
  if (error) throw new Error(`[DB] adminQuestions: ${error.message}`);
  const rows = (data || []).sort((a, b) =>
    (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1)
    || (a.created_at < b.created_at ? 1 : -1));
  return rows.map(q => serializeQuestionForAdmin({
    ...q, first_name: q.participants?.first_name, last_name: q.participants?.last_name,
  }));
}

export async function assignQuestion(id, { pastorName, place, time }) {
  const { data: existing } = await supabase.from('questions').select('id').eq('id', id).maybeSingle();
  if (!existing) return null;
  const res = await supabase.from('questions').update({
    status: 'assigned', pastor_name: pastorName, place, time, updated_at: nowIso(),
  }).eq('id', id);
  must(res, 'assignQuestion');
  return true;
}

// ---------------- Statistiques ----------------
export async function stats() {
  const count = async (table, filter) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = filter(q);
    const { count: c } = await q;
    return c || 0;
  };
  const registered = await count('participants');
  const checkins = await count('checkins');
  const received = await count('questions');
  const handled = await count('questions', q => q.eq('status', 'assigned'));
  const activeSince = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const active = await count('participants', q => q.gte('last_seen', activeSince));

  const { data: countries } = await supabase.from('participants').select('country');
  const tally = {};
  for (const row of countries || []) tally[row.country] = (tally[row.country] || 0) + 1;
  const total = (countries || []).length || 1;
  const byCountry = Object.entries(tally).sort((a, b) => b[1] - a[1])
    .map(([country, c]) => ({ country, count: c, pct: Math.round((c / total) * 100) }));

  return {
    registered, checkins, received, handled, active,
    attendanceRate: registered ? Math.round((checkins / registered) * 100) : 0,
    byCountry,
  };
}

export async function checkinParticipant(participantId) {
  await supabase.from('checkins').upsert({ participant_id: participantId, created_at: nowIso() }, { onConflict: 'participant_id' });
}

// ---------------- Sessions admin ----------------
export async function createAdminSession(token, expiresAt) {
  const res = await supabase.from('admin_sessions').insert({ token, created_at: nowIso(), expires_at: expiresAt });
  must(res, 'createAdminSession');
}
export async function adminSession(token) {
  const { data } = await supabase.from('admin_sessions').select('*').eq('token', token).maybeSingle();
  return data || null;
}
export async function deleteAdminSession(token) {
  await supabase.from('admin_sessions').delete().eq('token', token);
}
export async function purgeExpiredAdminSessions() {
  await supabase.from('admin_sessions').delete().lt('expires_at', nowIso());
}

// ---------------- Logements ----------------
export async function autoLinkParticipant({ id, first_name, last_name, phone }) {
  const { data: rows } = await supabase.from('housing').select('*').is('participant_id', null);
  const pPhone = normPhone(phone);
  const pName = normName(first_name) + '|' + normName(last_name);
  const byPhone = pPhone ? (rows || []).filter(h => normPhone(h.phone) === pPhone) : [];
  const byName = (rows || []).filter(h => (normName(h.first_name) + '|' + normName(h.last_name)) === pName);
  const match = byPhone.length === 1 ? byPhone[0] : (byName.length === 1 ? byName[0] : null);
  if (!match) return null;
  await supabase.from('housing').update({ participant_id: id, updated_at: nowIso() }).eq('id', match.id);
  return match.id;
}

async function autoLinkHousingRow(row) {
  const { data: linkedRows } = await supabase.from('housing').select('participant_id').not('participant_id', 'is', null);
  const linked = new Set((linkedRows || []).map(r => r.participant_id));
  const participants = (await allParticipants()).filter(p => !linked.has(p.id));
  const hPhone = normPhone(row.phone);
  const hName = normName(row.first_name) + '|' + normName(row.last_name);
  const byPhone = hPhone ? participants.filter(p => normPhone(p.phone) === hPhone) : [];
  const byName = participants.filter(p => (normName(p.first_name) + '|' + normName(p.last_name)) === hName);
  const match = byPhone.length === 1 ? byPhone[0] : (byName.length === 1 ? byName[0] : null);
  if (!match) return false;
  await supabase.from('housing').update({ participant_id: match.id, updated_at: nowIso() }).eq('id', row.id);
  return true;
}

export async function importHousing(rows) {
  let created = 0, linked = 0;
  for (const r of rows) {
    const firstName = String(r.firstName || '').trim();
    const lastName = String(r.lastName || '').trim();
    if (!firstName && !lastName) continue;
    const id = randomUUID();
    const row = {
      id, first_name: firstName, last_name: lastName,
      phone: String(r.phone || '').trim(), country: String(r.country || '').trim(),
      address: String(r.address || '').trim(), notes: String(r.notes || '').trim(),
      created_at: nowIso(), updated_at: nowIso(),
    };
    const res = await supabase.from('housing').insert(row);
    must(res, 'importHousing');
    created++;
    if (await autoLinkHousingRow(row)) linked++;
  }
  return { created, linked };
}

export async function listHousing() {
  const { data, error } = await supabase.from('housing')
    .select('*, participants(first_name, last_name, phone, country)').order('last_name');
  if (error) throw new Error(`[DB] listHousing: ${error.message}`);
  return (data || []).map(serializeHousing);
}

export async function housingById(id) {
  const { data } = await supabase.from('housing').select('*, participants(first_name, last_name, phone, country)').eq('id', id).maybeSingle();
  return data || null;
}

export async function updateHousing(id, b, existing) {
  const res = await supabase.from('housing').update({
    first_name: String(b.firstName ?? existing.first_name).trim(),
    last_name: String(b.lastName ?? existing.last_name).trim(),
    phone: String(b.phone ?? existing.phone).trim(),
    country: String(b.country ?? existing.country).trim(),
    address: String(b.address ?? existing.address).trim(),
    notes: String(b.notes ?? existing.notes).trim(),
    updated_at: nowIso(),
  }).eq('id', id);
  must(res, 'updateHousing');
  return serializeHousing(await housingById(id));
}

export async function linkHousing(id, participantId) {
  if (participantId) {
    const { data: p } = await supabase.from('participants').select('id').eq('id', participantId).maybeSingle();
    if (!p) return { error: 'unknown_participant' };
    const { data: other } = await supabase.from('housing').select('id').eq('participant_id', participantId).neq('id', id).maybeSingle();
    if (other) return { error: 'participant_already_linked' };
  }
  await supabase.from('housing').update({ participant_id: participantId, updated_at: nowIso() }).eq('id', id);
  return { ok: true, housing: serializeHousing(await housingById(id)) };
}

export async function deleteHousing(id) {
  await supabase.from('housing').delete().eq('id', id);
}

/**
 * Un compte Supabase est-il administrateur ? La réponse vient de la table
 * app_admins, seule source de vérité, partagée avec le site : les policies RLS
 * du site s'appuient sur la même table. Déclarer un organisateur une fois lui
 * ouvre les deux espaces.
 *
 * Lu avec la clé service_role : le navigateur n'interroge jamais cette table.
 */
export async function isAppAdmin(userId) {
  if (!userId) return false;
  const { data, error } = await supabase.from('app_admins').select('user_id').eq('user_id', userId).maybeSingle();
  if (error) {
    // Table absente ou illisible : on refuse plutôt que d'ouvrir en grand.
    console.warn(`[ADMIN] app_admins illisible : ${error.message}`);
    return false;
  }
  return Boolean(data);
}

// Colonnes d'hébergement communes aux deux tables du site.
const SITE_HOUSING_COLUMNS = 'id, full_name, phone_code, phone, housing_address, room_number, housing_notes, start_date, end_date';

// Les tables du site ne nous appartiennent pas : si elles changent de forme ou
// disparaissent, l'application doit continuer de fonctionner sans hébergement
// plutôt que de tomber en panne.
async function siteRegistrations() {
  const tables = ['inscriptions', 'internal_members'];
  const results = await Promise.all(tables.map(async (table) => {
    const { data, error } = await supabase.from(table).select(SITE_HOUSING_COLUMNS);
    if (error) {
      console.warn(`[SITE] lecture de « ${table} » impossible : ${error.message}`);
      return [];
    }
    return data || [];
  }));
  return results.flat();
}

/** L'inscription du site correspondant à ce participant, ou null. */
export async function siteRegistrationFor(participant) {
  return matchRegistration(participant, await siteRegistrations());
}

/**
 * Hébergement du participant. L'assignation faite depuis l'administration de
 * l'application prime : c'est le moyen pour l'organisation de corriger une
 * erreur. À défaut, on reprend ce qui a été saisi sur le site.
 */
export async function myHousing(participant) {
  const { data } = await supabase.from('housing').select('*').eq('participant_id', participant.id).maybeSingle();
  if (data) {
    return {
      id: data.id, source: 'organisation', address: data.address, room: '',
      notes: data.notes, startDate: null, endDate: null, updatedAt: data.updated_at,
    };
  }
  return housingFromRegistration(await siteRegistrationFor(participant));
}

export async function adminParticipants() {
  const { data: linkedRows } = await supabase.from('housing').select('participant_id').not('participant_id', 'is', null);
  const linked = new Set((linkedRows || []).map(r => r.participant_id));
  const { data } = await supabase.from('participants')
    .select('id, first_name, last_name, phone, country, created_at').order('last_name');
  return (data || []).map(p => ({
    id: p.id, firstName: p.first_name, lastName: p.last_name, phone: p.phone,
    country: p.country, createdAt: p.created_at, housed: linked.has(p.id),
  }));
}

// ---------------- Abonnements push ----------------
export async function saveSubscription({ endpoint, keys }, { participantId = null, lang = 'fr' } = {}) {
  const res = await supabase.from('push_subscriptions').upsert({
    endpoint, p256dh: keys.p256dh, auth: keys.auth,
    participant_id: participantId, lang, created_at: nowIso(), last_error: null,
  }, { onConflict: 'endpoint' });
  must(res, 'saveSubscription');
}
export async function removeSubscription(endpoint) {
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
}
export async function allSubscriptions() {
  const { data } = await supabase.from('push_subscriptions').select('*');
  return data || [];
}
export async function markSubscriptionError(endpoint, message) {
  await supabase.from('push_subscriptions').update({ last_error: message }).eq('endpoint', endpoint);
}

// ---------------- Photos (pellicule) + Storage ----------------
export async function uploadMedia(buffer, contentType, ext) {
  const name = `${randomUUID()}${ext}`;
  const res = await supabase.storage.from(MEDIA_BUCKET).upload(name, buffer, { contentType, upsert: false });
  if (res.error) throw new Error(`[STORAGE] upload: ${res.error.message}`);
  return { name, url: publicMediaUrl(name) };
}

export async function createPhoto(participantId, fileName) {
  const id = randomUUID();
  const res = await supabase.from('photos').insert({ id, participant_id: participantId, file: fileName, created_at: nowIso() });
  must(res, 'createPhoto');
  return { id, url: publicMediaUrl(fileName) };
}

export async function listPhotos(limit = 300) {
  const { data } = await supabase.from('photos')
    .select('id, file, created_at, participants(first_name, last_name)')
    .order('created_at', { ascending: false }).limit(limit);
  return (data || []).map(r => ({
    id: r.id, url: publicMediaUrl(r.file), createdAt: r.created_at,
    author: `${r.participants?.first_name || ''} ${(r.participants?.last_name || '').charAt(0).toUpperCase()}${r.participants?.last_name ? '.' : ''}`.trim() || 'Participant',
  }));
}

export async function adminPhotos(limit = 1000) {
  const { data } = await supabase.from('photos')
    .select('id, file, created_at, participants(first_name, last_name)')
    .order('created_at', { ascending: false }).limit(limit);
  return (data || []).map(r => ({
    id: r.id, file: r.file, url: publicMediaUrl(r.file), createdAt: r.created_at,
    author: `${r.participants?.first_name || ''} ${r.participants?.last_name || ''}`.trim(),
  }));
}

export async function deletePhoto(id) {
  const { data } = await supabase.from('photos').select('file').eq('id', id).maybeSingle();
  if (data) {
    await supabase.storage.from(MEDIA_BUCKET).remove([data.file]);
    await supabase.from('photos').delete().eq('id', id);
  }
}

// ---------------- Limiteur de débit (atomique, en base) ----------------
export async function rateHit(bucket, ip, windowSeconds) {
  const { data, error } = await supabase.rpc('rl_hit', {
    p_bucket: bucket, p_ip: ip, p_window_seconds: windowSeconds,
  });
  if (error) return 0; // en cas d'erreur, on ne bloque pas le trafic légitime
  return data || 0;
}

// ---------------- Sérialisation ----------------
function serializeQuestionForParticipant(q) {
  return {
    id: q.id, text: q.text, status: q.status,
    pastor: q.pastor_name || null, place: q.place || null, time: q.time || null,
    createdAt: q.created_at, updatedAt: q.updated_at,
  };
}
function serializeQuestionForAdmin(q) {
  const name = `${q.first_name || ''} ${(q.last_name || '').charAt(0).toUpperCase()}${q.last_name ? '.' : ''}`.trim();
  return {
    id: q.id, text: q.text, status: q.status, participant: name || 'Participant',
    pastor: q.pastor_name || null, place: q.place || null, time: q.time || null,
    createdAt: q.created_at, updatedAt: q.updated_at,
  };
}
function serializeHousing(h) {
  const p = h.participants;
  return {
    id: h.id, firstName: h.first_name, lastName: h.last_name, phone: h.phone,
    country: h.country, address: h.address, notes: h.notes,
    participant: (h.participant_id && p)
      ? { id: h.participant_id, firstName: p.first_name, lastName: p.last_name, phone: p.phone, country: p.country }
      : null,
    createdAt: h.created_at, updatedAt: h.updated_at,
  };
}
