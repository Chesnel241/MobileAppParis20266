import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { mkdirSync, unlinkSync } from 'node:fs';
import db from './db.js';
import { defaultContent, CONTENT_SECTIONS } from './defaults.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 8080;
const ADMIN_CODE = process.env.ADMIN_CODE || 'LWMFD2026';
const ADMIN_SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS || 24);
const UPLOADS_DIR = process.env.UPLOADS_DIR || './data/uploads';
mkdirSync(UPLOADS_DIR, { recursive: true });

// Extensions autorisées par type de média
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const AUDIO_EXT = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.opus'];

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname || '').toLowerCase();
      cb(null, `${randomUUID()}${IMAGE_EXT.concat(AUDIO_EXT).includes(ext) ? ext : '.bin'}`);
    },
  }),
  limits: { fileSize: 80 * 1024 * 1024 },
});

function isAllowed(file, exts) {
  return exts.includes(extname(file.filename).toLowerCase());
}
function dropFile(file) {
  try { unlinkSync(join(UPLOADS_DIR, file.filename)); } catch { /* déjà supprimé */ }
}

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '64kb' }));

const now = () => new Date().toISOString();
const token = () => randomBytes(24).toString('hex');

// Comparaison à temps constant (évite les attaques temporelles sur le code admin)
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// ---- Middlewares d'authentification ----
function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function requireParticipant(req, res, next) {
  const t = bearer(req);
  const p = t && db.prepare('SELECT * FROM participants WHERE token = ?').get(t);
  if (!p) return res.status(401).json({ error: 'unauthorized' });
  db.prepare('UPDATE participants SET last_seen = ? WHERE id = ?').run(now(), p.id);
  req.participant = p;
  next();
}

function requireAdmin(req, res, next) {
  const t = bearer(req);
  const s = t && db.prepare('SELECT * FROM admin_sessions WHERE token = ?').get(t);
  if (!s || new Date(s.expires_at) < new Date()) {
    return res.status(401).json({ error: 'admin_unauthorized' });
  }
  next();
}

// ---- Amorçage du contenu éditable (première exécution) ----
function seedContent() {
  const exists = db.prepare('SELECT 1 FROM content WHERE section = ?');
  const insert = db.prepare('INSERT INTO content (section, data, updated_at) VALUES (?, ?, ?)');
  for (const section of CONTENT_SECTIONS) {
    if (!exists.get(section)) {
      insert.run(section, JSON.stringify(defaultContent[section]), now());
    }
  }
}
seedContent();

function getContent() {
  const rows = db.prepare('SELECT section, data FROM content').all();
  const out = { ...defaultContent };
  for (const r of rows) {
    try { out[r.section] = JSON.parse(r.data); } catch { /* garde le défaut */ }
  }
  return out;
}

// ---- Santé ----
app.get('/api/health', (_req, res) => res.json({ ok: true, time: now() }));

// ---- Contenu éditable (lecture publique pour l'app) ----
app.get('/api/content', (_req, res) => res.json(getContent()));

app.put('/api/admin/content/:section', requireAdmin, (req, res) => {
  const { section } = req.params;
  if (!CONTENT_SECTIONS.includes(section)) {
    return res.status(400).json({ error: 'unknown_section' });
  }
  if (req.body === undefined || req.body === null) {
    return res.status(400).json({ error: 'missing_body' });
  }
  db.prepare(`INSERT INTO content (section, data, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(section) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`)
    .run(section, JSON.stringify(req.body), now());
  res.json({ ok: true, section });
});

// ---- Notifications (diffusées par les organisateurs) ----
app.get('/api/notifications', (_req, res) => {
  const rows = db.prepare('SELECT id, text_fr, text_en, created_at FROM notifications ORDER BY created_at DESC LIMIT 50').all();
  res.json(rows.map(n => ({ id: n.id, fr: n.text_fr, en: n.text_en, createdAt: n.created_at })));
});

app.post('/api/admin/notifications', requireAdmin, (req, res) => {
  const { textFr, textEn } = req.body || {};
  const fr = (textFr || '').trim();
  const en = (textEn || textFr || '').trim();
  if (!fr) return res.status(400).json({ error: 'empty_text' });
  const id = randomUUID();
  db.prepare('INSERT INTO notifications (id, text_fr, text_en, created_at) VALUES (?, ?, ?, ?)')
    .run(id, fr, en, now());
  res.status(201).json({ id, fr, en });
});

// ---- Liaison automatique participant ↔ logement ----
// Un participant est reconnu par son téléphone (9 derniers chiffres) ou, à défaut,
// par son couple prénom+nom normalisé (minuscules, sans accents).
const normPhone = (p) => String(p || '').replace(/\D/g, '').slice(-9);
const normName = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

// Tente de lier un participant à une ligne logement non liée. Retourne l'id logement lié ou null.
function autoLinkParticipant(participant) {
  const rows = db.prepare('SELECT * FROM housing WHERE participant_id IS NULL').all();
  const pPhone = normPhone(participant.phone);
  const pName = normName(participant.first_name) + '|' + normName(participant.last_name);
  const byPhone = pPhone ? rows.filter(h => normPhone(h.phone) === pPhone) : [];
  const byName = rows.filter(h => (normName(h.first_name) + '|' + normName(h.last_name)) === pName);
  const match = byPhone.length === 1 ? byPhone[0] : (byName.length === 1 ? byName[0] : null);
  if (!match) return null;
  db.prepare('UPDATE housing SET participant_id = ?, updated_at = ? WHERE id = ?')
    .run(participant.id, now(), match.id);
  return match.id;
}

// Tente de lier une ligne logement non liée à un participant existant.
function autoLinkHousingRow(row) {
  const hPhone = normPhone(row.phone);
  const hName = normName(row.first_name) + '|' + normName(row.last_name);
  const linked = new Set(
    db.prepare('SELECT participant_id FROM housing WHERE participant_id IS NOT NULL').all()
      .map(r => r.participant_id)
  );
  const participants = db.prepare('SELECT * FROM participants').all().filter(p => !linked.has(p.id));
  const byPhone = hPhone ? participants.filter(p => normPhone(p.phone) === hPhone) : [];
  const byName = participants.filter(p => (normName(p.first_name) + '|' + normName(p.last_name)) === hName);
  const match = byPhone.length === 1 ? byPhone[0] : (byName.length === 1 ? byName[0] : null);
  if (!match) return false;
  db.prepare('UPDATE housing SET participant_id = ?, updated_at = ? WHERE id = ?')
    .run(match.id, now(), row.id);
  return true;
}

// ---- Inscription participant (première connexion, sans mot de passe) ----
app.post('/api/participants', (req, res) => {
  const { firstName, lastName, phone, country } = req.body || {};
  if (![firstName, lastName, phone, country].every(v => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const id = randomUUID();
  const t = token();
  db.prepare(`INSERT INTO participants (id, token, first_name, last_name, phone, country, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, t, firstName.trim(), lastName.trim(), phone.trim(), country.trim(), now());
  db.prepare('INSERT OR IGNORE INTO checkins (participant_id, created_at) VALUES (?, ?)').run(id, now());
  // Liaison automatique avec la liste des personnes prises en charge (logements)
  autoLinkParticipant({ id, first_name: firstName, last_name: lastName, phone });
  res.status(201).json({ id, token: t });
});

// Logement assigné au participant connecté (null si non pris en charge)
app.get('/api/participants/me/housing', requireParticipant, (req, res) => {
  const h = db.prepare('SELECT * FROM housing WHERE participant_id = ?').get(req.participant.id);
  if (!h) return res.json(null);
  res.json({ id: h.id, address: h.address, notes: h.notes, updatedAt: h.updated_at });
});

// Profil courant (permet de valider un token au démarrage de l'app)
app.get('/api/participants/me', requireParticipant, (req, res) => {
  const p = req.participant;
  res.json({
    id: p.id, firstName: p.first_name, lastName: p.last_name,
    phone: p.phone, country: p.country, role: p.role
  });
});

// ---- Questions (côté participant) ----
app.post('/api/questions', requireParticipant, (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'empty_text' });
  }
  const id = randomUUID();
  db.prepare(`INSERT INTO questions (id, participant_id, text, status, created_at, updated_at)
              VALUES (?, ?, ?, 'pending', ?, ?)`)
    .run(id, req.participant.id, text.trim(), now(), now());
  res.status(201).json(serializeQuestionForParticipant(getQuestion(id)));
});

app.get('/api/questions/mine', requireParticipant, (req, res) => {
  const rows = db.prepare('SELECT * FROM questions WHERE participant_id = ? ORDER BY created_at DESC')
    .all(req.participant.id);
  res.json(rows.map(serializeQuestionForParticipant));
});

// ---- Admin (organisateurs & pasteurs) ----
app.post('/api/admin/login', (req, res) => {
  const { code } = req.body || {};
  if (!safeEqual(code, ADMIN_CODE)) {
    return res.status(401).json({ error: 'bad_code' });
  }
  const t = token();
  const expires = new Date(Date.now() + ADMIN_SESSION_HOURS * 3600 * 1000).toISOString();
  db.prepare('INSERT INTO admin_sessions (token, created_at, expires_at) VALUES (?, ?, ?)')
    .run(t, now(), expires);
  res.json({ token: t, expiresAt: expires });
});

app.get('/api/admin/questions', requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT q.*, p.first_name, p.last_name
    FROM questions q JOIN participants p ON p.id = q.participant_id
    ORDER BY CASE q.status WHEN 'pending' THEN 0 ELSE 1 END, q.created_at DESC
  `).all();
  res.json(rows.map(serializeQuestionForAdmin));
});

app.post('/api/admin/questions/:id/assign', requireAdmin, (req, res) => {
  const { pastorName, place, time } = req.body || {};
  if (![pastorName, place, time].every(v => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const q = getQuestion(req.params.id);
  if (!q) return res.status(404).json({ error: 'not_found' });
  db.prepare(`UPDATE questions
              SET status = 'assigned', pastor_name = ?, place = ?, time = ?, updated_at = ?
              WHERE id = ?`)
    .run(pastorName.trim(), place.trim(), time.trim(), now(), q.id);
  res.json(serializeQuestionForAdmin({ ...getQuestion(q.id), first_name: '', last_name: '' }));
});

app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const registered = db.prepare('SELECT COUNT(*) c FROM participants').get().c;
  const checkins = db.prepare('SELECT COUNT(*) c FROM checkins').get().c;
  const received = db.prepare('SELECT COUNT(*) c FROM questions').get().c;
  const handled = db.prepare("SELECT COUNT(*) c FROM questions WHERE status = 'assigned'").get().c;
  const activeSince = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const active = db.prepare('SELECT COUNT(*) c FROM participants WHERE last_seen >= ?').get(activeSince).c;

  const byCountryRows = db.prepare(`
    SELECT country, COUNT(*) c FROM participants GROUP BY country ORDER BY c DESC
  `).all();
  const total = byCountryRows.reduce((s, r) => s + r.c, 0) || 1;
  const byCountry = byCountryRows.map(r => ({
    country: r.country, count: r.c, pct: Math.round((r.c / total) * 100)
  }));

  res.json({
    registered, checkins, received, handled, active,
    attendanceRate: registered ? Math.round((checkins / registered) * 100) : 0,
    byCountry
  });
});

// ---- Logements (personnes prises en charge par l'organisation) ----
function serializeHousing(h) {
  let participant = null;
  if (h.participant_id) {
    const p = db.prepare('SELECT first_name, last_name, phone, country FROM participants WHERE id = ?')
      .get(h.participant_id);
    if (p) participant = { id: h.participant_id, firstName: p.first_name, lastName: p.last_name, phone: p.phone, country: p.country };
  }
  return {
    id: h.id, firstName: h.first_name, lastName: h.last_name, phone: h.phone,
    country: h.country, address: h.address, notes: h.notes,
    participant, createdAt: h.created_at, updatedAt: h.updated_at
  };
}

app.get('/api/admin/housing', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM housing ORDER BY last_name, first_name').all();
  res.json(rows.map(serializeHousing));
});

// Import en masse : [{firstName, lastName, phone?, country?, address?, notes?}]
app.post('/api/admin/housing/import', requireAdmin, (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!rows || !rows.length) return res.status(400).json({ error: 'empty_rows' });
  let created = 0, linked = 0;
  for (const r of rows) {
    const firstName = String(r.firstName || '').trim();
    const lastName = String(r.lastName || '').trim();
    if (!firstName && !lastName) continue;
    const id = randomUUID();
    db.prepare(`INSERT INTO housing (id, first_name, last_name, phone, country, address, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, firstName, lastName, String(r.phone || '').trim(), String(r.country || '').trim(),
           String(r.address || '').trim(), String(r.notes || '').trim(), now(), now());
    created++;
    if (autoLinkHousingRow(db.prepare('SELECT * FROM housing WHERE id = ?').get(id))) linked++;
  }
  res.status(201).json({ created, linked });
});

app.put('/api/admin/housing/:id', requireAdmin, (req, res) => {
  const h = db.prepare('SELECT * FROM housing WHERE id = ?').get(req.params.id);
  if (!h) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  db.prepare(`UPDATE housing SET first_name = ?, last_name = ?, phone = ?, country = ?, address = ?, notes = ?, updated_at = ?
              WHERE id = ?`)
    .run(
      String(b.firstName ?? h.first_name).trim(), String(b.lastName ?? h.last_name).trim(),
      String(b.phone ?? h.phone).trim(), String(b.country ?? h.country).trim(),
      String(b.address ?? h.address).trim(), String(b.notes ?? h.notes).trim(), now(), h.id
    );
  res.json(serializeHousing(db.prepare('SELECT * FROM housing WHERE id = ?').get(h.id)));
});

// Lier / délier manuellement (l'organisation garde la main en cas d'erreur)
app.post('/api/admin/housing/:id/link', requireAdmin, (req, res) => {
  const h = db.prepare('SELECT * FROM housing WHERE id = ?').get(req.params.id);
  if (!h) return res.status(404).json({ error: 'not_found' });
  const participantId = req.body?.participantId || null;
  if (participantId) {
    const p = db.prepare('SELECT id FROM participants WHERE id = ?').get(participantId);
    if (!p) return res.status(400).json({ error: 'unknown_participant' });
    const already = db.prepare('SELECT id FROM housing WHERE participant_id = ? AND id != ?').get(participantId, h.id);
    if (already) return res.status(409).json({ error: 'participant_already_linked' });
  }
  db.prepare('UPDATE housing SET participant_id = ?, updated_at = ? WHERE id = ?')
    .run(participantId, now(), h.id);
  res.json(serializeHousing(db.prepare('SELECT * FROM housing WHERE id = ?').get(h.id)));
});

app.delete('/api/admin/housing/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM housing WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Liste des participants (pour la liaison manuelle dans l'admin)
app.get('/api/admin/participants', requireAdmin, (_req, res) => {
  const linked = new Set(
    db.prepare('SELECT participant_id FROM housing WHERE participant_id IS NOT NULL').all().map(r => r.participant_id)
  );
  const rows = db.prepare('SELECT id, first_name, last_name, phone, country, created_at FROM participants ORDER BY last_name, first_name').all();
  res.json(rows.map(p => ({
    id: p.id, firstName: p.first_name, lastName: p.last_name, phone: p.phone,
    country: p.country, createdAt: p.created_at, housed: linked.has(p.id)
  })));
});

// ---- Médias (admin) : fichiers audio des enseignements, photo de l'hôtel… ----
app.post('/api/admin/media', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'missing_file' });
  const kind = req.body?.kind === 'audio' ? 'audio' : 'image';
  const allowed = kind === 'audio' ? AUDIO_EXT : IMAGE_EXT;
  if (!isAllowed(req.file, allowed)) {
    dropFile(req.file);
    return res.status(400).json({ error: 'bad_file_type' });
  }
  res.status(201).json({ url: `/media/${req.file.filename}` });
});

// ---- Pellicule (photos partagées par les participants) ----
app.post('/api/photos', requireParticipant, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'missing_file' });
  if (!isAllowed(req.file, IMAGE_EXT)) {
    dropFile(req.file);
    return res.status(400).json({ error: 'bad_file_type' });
  }
  const id = randomUUID();
  db.prepare('INSERT INTO photos (id, participant_id, file, created_at) VALUES (?, ?, ?, ?)')
    .run(id, req.participant.id, req.file.filename, now());
  res.status(201).json({ id, url: `/media/${req.file.filename}` });
});

app.get('/api/photos', requireParticipant, (_req, res) => {
  const rows = db.prepare(`
    SELECT ph.id, ph.file, ph.created_at, p.first_name, p.last_name
    FROM photos ph JOIN participants p ON p.id = ph.participant_id
    ORDER BY ph.created_at DESC LIMIT 300
  `).all();
  res.json(rows.map(r => ({
    id: r.id, url: `/media/${r.file}`, createdAt: r.created_at,
    author: `${r.first_name} ${(r.last_name || '').charAt(0).toUpperCase()}${r.last_name ? '.' : ''}`.trim()
  })));
});

// Modération : liste + suppression côté admin
app.get('/api/admin/photos', requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT ph.id, ph.file, ph.created_at, p.first_name, p.last_name
    FROM photos ph JOIN participants p ON p.id = ph.participant_id
    ORDER BY ph.created_at DESC LIMIT 1000
  `).all();
  res.json(rows.map(r => ({
    id: r.id, url: `/media/${r.file}`, createdAt: r.created_at,
    author: `${r.first_name} ${r.last_name}`.trim()
  })));
});

app.delete('/api/admin/photos/:id', requireAdmin, (req, res) => {
  const ph = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (ph) {
    try { unlinkSync(join(UPLOADS_DIR, ph.file)); } catch { /* fichier déjà absent */ }
    db.prepare('DELETE FROM photos WHERE id = ?').run(ph.id);
  }
  res.json({ ok: true });
});

// ---- Fichiers médias téléversés ----
app.use('/media', express.static(UPLOADS_DIR, { maxAge: '7d', immutable: true }));

// ---- Politique de confidentialité + page d'accueil ----
app.use(express.static(join(__dirname, '..', 'public')));
app.get('/', (_req, res) => res.sendFile(join(__dirname, '..', 'public', 'index.html')));

// ---- Helpers ----
function getQuestion(id) {
  return db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
}
function serializeQuestionForParticipant(q) {
  return {
    id: q.id, text: q.text, status: q.status,
    pastor: q.pastor_name || null, place: q.place || null, time: q.time || null,
    createdAt: q.created_at, updatedAt: q.updated_at
  };
}
function serializeQuestionForAdmin(q) {
  const name = `${q.first_name || ''} ${(q.last_name || '').charAt(0).toUpperCase()}${q.last_name ? '.' : ''}`.trim();
  return {
    id: q.id, text: q.text, status: q.status, participant: name || 'Participant',
    pastor: q.pastor_name || null, place: q.place || null, time: q.time || null,
    createdAt: q.created_at, updatedAt: q.updated_at
  };
}

// Purge quotidienne des sessions admin expirées
setInterval(() => {
  db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(now());
}, 3600 * 1000).unref();

app.listen(PORT, () => {
  console.log(`Paris 2026 API en écoute sur le port ${PORT}`);
});
