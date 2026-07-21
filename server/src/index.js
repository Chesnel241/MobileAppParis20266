import express from 'express';
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import sharp from 'sharp';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { mkdirSync, unlinkSync } from 'node:fs';
import config from './config.js';
import { fetchSupabaseUser, isAuthorizedAdmin, adminLabel } from './supabaseAuth.js';
import { initPush, broadcast, saveSubscription, removeSubscription } from './push.js';
import db from './db.js';
import { defaultContent, CONTENT_SECTIONS } from './defaults.js';
import {
  InputValidationError,
  participantIdentityKey,
  validateAdminLoginInput,
  validateContentSection,
  validateHousingImportInput,
  validateHousingLinkInput,
  validateHousingUpdateInput,
  validateNotificationInput,
  validatePushSubscriptionInput,
  validatePushUnsubscribeInput,
  validateParticipantInput,
  validateQuestionAssignmentInput,
  validateQuestionInput,
} from './validation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = config.port;
const ADMIN_CODE = config.adminCode;
const ADMIN_SESSION_HOURS = config.adminSessionHours;
const UPLOADS_DIR = config.uploadsDir;
// En production, la configuration refuse de démarrer si cette liste est vide.
const CORS_ORIGINS = config.corsOrigins;
mkdirSync(UPLOADS_DIR, { recursive: true });

// Active les notifications push si les clés VAPID sont configurées.
if (initPush(config.vapid)) {
  console.log('[PUSH] notifications push activées');
} else {
  console.warn('[PUSH] VAPID absent : notifications push désactivées');
}

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

// Ré-encode une image : respecte l'orientation EXIF, borne la taille et SUPPRIME toutes
// les métadonnées (dont la géolocalisation GPS). Renvoie le nouveau nom de fichier (.jpg).
// En cas d'échec (fichier non-image), supprime le fichier et renvoie null.
async function processImage(file, maxDim = 1920) {
  const srcPath = join(UPLOADS_DIR, file.filename);
  const outName = `${randomUUID()}.jpg`;
  const outPath = join(UPLOADS_DIR, outName);
  try {
    await sharp(srcPath)
      .rotate() // auto-orientation d'après EXIF, avant suppression des métadonnées
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toFile(outPath); // sharp n'inclut pas les métadonnées par défaut → EXIF/GPS supprimés
    dropFile(file);
    return outName;
  } catch {
    dropFile(file);
    try { unlinkSync(outPath); } catch { /* rien à nettoyer */ }
    return null;
  }
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(cors(CORS_ORIGINS.length ? { origin: CORS_ORIGINS } : {}));

// En-têtes de sécurité (équivalent minimal de helmet, sans dépendance)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    // Le panneau d'administration s'authentifie auprès de Supabase : son origine
    // doit être autorisée, sinon la CSP bloque la connexion.
    `connect-src 'self'${config.supabase ? ` ${config.supabase.url}` : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
  ].join('; '));
  next();
});

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// `strict: false` est nécessaire car countdownTargetISO est une chaîne JSON.
// Le gestionnaire d'erreurs plus bas transforme les JSON malformés en 400.
app.use(express.json({ limit: '64kb', strict: false }));

const now = () => new Date().toISOString();
const token = () => randomBytes(24).toString('hex');

// Express 4 ne capture pas les rejets des handlers async : sans ce wrapper,
// une erreur levée dans un handler async laisserait la requête sans réponse.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---- Limiteurs de débit (anti-abus / anti-force brute) ----
const makeLimiter = (windowMs, max, message) => rateLimit({
  windowMs, max, standardHeaders: true, legacyHeaders: false,
  message: { error: message || 'too_many_requests' },
});
const loginLimiter = makeLimiter(15 * 60 * 1000, 20, 'too_many_login_attempts'); // 20 / 15 min / IP
const registerLimiter = makeLimiter(60 * 60 * 1000, 30, 'too_many_registrations'); // 30 / h / IP
const writeLimiter = makeLimiter(60 * 1000, 30, 'too_many_requests');              // 30 / min / IP
const uploadLimiter = makeLimiter(60 * 1000, 15, 'too_many_uploads');              // 15 / min / IP

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
  const value = h.startsWith('Bearer ') ? h.slice(7) : null;
  return value && /^[0-9a-f]{48}$/.test(value) ? value : null;
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
    if (s) db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(t);
    return res.status(401).json({ error: 'admin_unauthorized' });
  }
  req.adminToken = t;
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
  const content = validateContentSection(section, req.body);
  db.prepare(`INSERT INTO content (section, data, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(section) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`)
    .run(section, JSON.stringify(content), now());
  res.json({ ok: true, section });
});

// ---- Notifications (diffusées par les organisateurs) ----
app.get('/api/notifications', (_req, res) => {
  const rows = db.prepare('SELECT id, text_fr, text_en, created_at FROM notifications ORDER BY created_at DESC LIMIT 50').all();
  res.json(rows.map(n => ({ id: n.id, fr: n.text_fr, en: n.text_en, createdAt: n.created_at })));
});

app.post('/api/admin/notifications', requireAdmin, asyncHandler(async (req, res) => {
  const { textFr: fr, textEn: en } = validateNotificationInput(req.body);
  const id = randomUUID();
  db.prepare('INSERT INTO notifications (id, text_fr, text_en, created_at) VALUES (?, ?, ?, ?)')
    .run(id, fr, en, now());
  // Diffusion push immédiate ; un échec d'envoi n'invalide pas la notification.
  const push = await broadcast({ fr, en });
  res.status(201).json({ id, fr, en, push });
}));

// ---- Abonnements aux notifications push ----
app.get('/api/push/public-key', (_req, res) => {
  res.json({ publicKey: config.vapid ? config.vapid.publicKey : null });
});

app.post('/api/push/subscribe', writeLimiter, requireParticipant, (req, res) => {
  if (!config.vapid) return res.status(503).json({ error: 'push_not_configured' });
  const { subscription, lang } = validatePushSubscriptionInput(req.body);
  saveSubscription(subscription, {
    participantId: req.participant.id,
    lang: lang === 'en' ? 'en' : 'fr',
  });
  res.status(201).json({ ok: true });
});

app.post('/api/push/unsubscribe', writeLimiter, requireParticipant, (req, res) => {
  const { endpoint } = validatePushUnsubscribeInput(req.body);
  removeSubscription(endpoint);
  res.json({ ok: true });
});

// ---- Inscription participant (première connexion, sans mot de passe) ----
app.post('/api/participants', registerLimiter, (req, res) => {
  const participant = validateParticipantInput(req.body);
  const identityKey = participantIdentityKey(participant);
  const duplicate = db.prepare('SELECT first_name, last_name, phone FROM participants').all()
    .some(existing => participantIdentityKey(existing) === identityKey);
  if (duplicate) return res.status(409).json({ error: 'participant_already_exists' });

  const id = randomUUID();
  const t = token();
  db.prepare(`INSERT INTO participants (id, token, first_name, last_name, phone, country, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, t, participant.firstName, participant.lastName, participant.phone, participant.country, now());
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

// Suppression complète du compte : les FK suppriment questions/check-in/photos et
// délient le logement. Les fichiers de la pellicule sont ensuite retirés du volume.
app.delete('/api/participants/me', requireParticipant, (req, res) => {
  const photos = db.prepare('SELECT file FROM photos WHERE participant_id = ?').all(req.participant.id);
  db.prepare('DELETE FROM participants WHERE id = ?').run(req.participant.id);
  for (const photo of photos) dropFile({ filename: photo.file });
  res.json({ ok: true });
});

// ---- Questions (côté participant) ----
app.post('/api/questions', writeLimiter, requireParticipant, (req, res) => {
  const { text } = validateQuestionInput(req.body);
  const id = randomUUID();
  const createdAt = now();
  db.prepare(`INSERT INTO questions (id, participant_id, text, consent_at, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, 'pending', ?, ?)`)
    .run(id, req.participant.id, text, createdAt, createdAt, createdAt);
  res.status(201).json(serializeQuestionForParticipant(getQuestion(id)));
});

app.get('/api/questions/mine', requireParticipant, (req, res) => {
  const rows = db.prepare('SELECT * FROM questions WHERE participant_id = ? ORDER BY created_at DESC')
    .all(req.participant.id);
  res.json(rows.map(serializeQuestionForParticipant));
});

// ---- Admin (organisateurs & pasteurs) ----
// Indique au panneau d'administration quelles méthodes de connexion proposer.
// Ne divulgue que des valeurs publiques (URL du projet et clé anonyme Supabase).
app.get('/api/admin/auth-config', (_req, res) => {
  res.json({
    codeEnabled: config.allowAdminCode,
    supabase: config.supabase
      ? { url: config.supabase.url, anonKey: config.supabase.anonKey }
      : null,
  });
});

// Connexion administrateur : par compte Supabase existant (recommandé) ou par
// code partagé. Dans les deux cas, une session admin locale est émise ensuite,
// si bien que tous les autres endpoints restent inchangés.
app.post('/api/admin/login', loginLimiter, asyncHandler(async (req, res) => {
  const { code, supabaseAccessToken } = validateAdminLoginInput(req.body);

  let grantedTo = null;

  if (supabaseAccessToken) {
    if (!config.supabase) return res.status(400).json({ error: 'supabase_not_configured' });
    const user = await fetchSupabaseUser(supabaseAccessToken, config.supabase);
    if (!user) return res.status(401).json({ error: 'bad_supabase_token' });
    if (!isAuthorizedAdmin(user, config.supabase)) {
      return res.status(403).json({ error: 'not_an_admin' });
    }
    grantedTo = adminLabel(user);
  } else {
    if (!config.allowAdminCode) return res.status(400).json({ error: 'code_login_disabled' });
    if (!safeEqual(code, ADMIN_CODE)) return res.status(401).json({ error: 'bad_code' });
    grantedTo = 'code partagé';
  }

  const t = token();
  const expires = new Date(Date.now() + ADMIN_SESSION_HOURS * 3600 * 1000).toISOString();
  db.prepare('INSERT INTO admin_sessions (token, created_at, expires_at) VALUES (?, ?, ?)')
    .run(t, now(), expires);
  console.log(`[ADMIN] session ouverte pour ${grantedTo}`);
  res.json({ token: t, expiresAt: expires });
}));

// Révoque immédiatement la session courante (et uniquement celle-ci).
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(req.adminToken);
  res.json({ ok: true });
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
  const { pastorName, place, time } = validateQuestionAssignmentInput(req.body);
  const q = getQuestion(req.params.id);
  if (!q) return res.status(404).json({ error: 'not_found' });
  db.prepare(`UPDATE questions
              SET status = 'assigned', pastor_name = ?, place = ?, time = ?, updated_at = ?
              WHERE id = ?`)
    .run(pastorName, place, time, now(), q.id);
  res.json(serializeQuestionForAdmin({ ...getQuestion(q.id), first_name: '', last_name: '' }));
});

// Le check-in est une action organisateur explicite et idempotente.
app.post('/api/admin/participants/:id/checkin', requireAdmin, (req, res) => {
  const participant = db.prepare('SELECT id FROM participants WHERE id = ?').get(req.params.id);
  if (!participant) return res.status(404).json({ error: 'not_found' });
  const createdAt = now();
  const result = db.prepare('INSERT OR IGNORE INTO checkins (participant_id, created_at) VALUES (?, ?)')
    .run(participant.id, createdAt);
  const checkin = db.prepare('SELECT created_at FROM checkins WHERE participant_id = ?').get(participant.id);
  res.status(result.changes ? 201 : 200).json({
    ok: true,
    participantId: participant.id,
    checkedIn: true,
    created: result.changes === 1,
    createdAt: checkin.created_at,
  });
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
  const { rows } = validateHousingImportInput(req.body);
  const insert = db.prepare(`INSERT INTO housing
    (id, first_name, last_name, phone, country, address, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const importRows = db.transaction(items => {
    for (const row of items) {
      const id = randomUUID();
      const createdAt = now();
      insert.run(id, row.firstName, row.lastName, row.phone, row.country,
        row.address, row.notes, createdAt, createdAt);
    }
  });
  importRows(rows);
  // Champ conservé pour compatibilité, mais toute liaison est désormais manuelle.
  res.status(201).json({ created: rows.length, linked: 0 });
});

app.put('/api/admin/housing/:id', requireAdmin, (req, res) => {
  const h = db.prepare('SELECT * FROM housing WHERE id = ?').get(req.params.id);
  if (!h) return res.status(404).json({ error: 'not_found' });
  const b = validateHousingUpdateInput(req.body, h);
  db.prepare(`UPDATE housing SET first_name = ?, last_name = ?, phone = ?, country = ?, address = ?, notes = ?, updated_at = ?
              WHERE id = ?`)
    .run(
      b.firstName, b.lastName, b.phone, b.country, b.address, b.notes, now(), h.id
    );
  res.json(serializeHousing(db.prepare('SELECT * FROM housing WHERE id = ?').get(h.id)));
});

// Lier / délier manuellement (l'organisation garde la main en cas d'erreur)
app.post('/api/admin/housing/:id/link', requireAdmin, (req, res) => {
  const h = db.prepare('SELECT * FROM housing WHERE id = ?').get(req.params.id);
  if (!h) return res.status(404).json({ error: 'not_found' });
  const { participantId } = validateHousingLinkInput(req.body);
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
app.post('/api/admin/media', uploadLimiter, requireAdmin, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'missing_file' });
  const kind = req.body?.kind === 'audio' ? 'audio' : 'image';
  const allowed = kind === 'audio' ? AUDIO_EXT : IMAGE_EXT;
  if (!isAllowed(req.file, allowed)) {
    dropFile(req.file);
    return res.status(400).json({ error: 'bad_file_type' });
  }
  if (kind === 'image') {
    const name = await processImage(req.file);
    if (!name) return res.status(400).json({ error: 'invalid_image' });
    return res.status(201).json({ url: `/media/${name}` });
  }
  res.status(201).json({ url: `/media/${req.file.filename}` });
}));

// ---- Pellicule (photos partagées par les participants) ----
// Défense en profondeur : ré-encodage + suppression des métadonnées (GPS) côté serveur.
app.post('/api/photos', uploadLimiter, requireParticipant, upload.single('photo'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'missing_file' });
  if (req.body?.consent !== 'true') {
    dropFile(req.file);
    return res.status(400).json({ error: 'explicit_consent_required', field: 'consent' });
  }
  if (!isAllowed(req.file, IMAGE_EXT)) {
    dropFile(req.file);
    return res.status(400).json({ error: 'bad_file_type' });
  }
  const name = await processImage(req.file);
  if (!name) return res.status(400).json({ error: 'invalid_image' });
  const id = randomUUID();
  const createdAt = now();
  db.prepare("INSERT INTO photos (id, participant_id, file, status, consent_at, created_at) VALUES (?, ?, ?, 'pending', ?, ?)")
    .run(id, req.participant.id, name, createdAt, createdAt);
  res.status(201).json({ id, url: `/media/${name}`, status: 'pending' });
}));

app.get('/api/photos', requireParticipant, (_req, res) => {
  const rows = db.prepare(`
    SELECT ph.id, ph.file, ph.created_at, p.first_name, p.last_name
    FROM photos ph JOIN participants p ON p.id = ph.participant_id
    WHERE ph.status = 'approved'
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
    SELECT ph.id, ph.file, ph.status, ph.created_at, p.first_name, p.last_name
    FROM photos ph JOIN participants p ON p.id = ph.participant_id
    ORDER BY CASE ph.status WHEN 'pending' THEN 0 ELSE 1 END, ph.created_at DESC LIMIT 1000
  `).all();
  res.json(rows.map(r => ({
    id: r.id, url: `/media/${r.file}`, status: r.status, createdAt: r.created_at,
    author: `${r.first_name} ${r.last_name}`.trim()
  })));
});

// Approbation idempotente avant publication dans la pellicule publique.
app.post('/api/admin/photos/:id/approve', requireAdmin, (req, res) => {
  const photo = db.prepare('SELECT id, status FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'not_found' });
  const changed = photo.status !== 'approved';
  if (changed) db.prepare("UPDATE photos SET status = 'approved' WHERE id = ?").run(photo.id);
  res.json({ ok: true, id: photo.id, status: 'approved', changed });
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

// ---- Gestion centralisée des erreurs (dont fichiers trop volumineux) ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err instanceof InputValidationError) {
    return res.status(err.status).json({ error: err.code, field: err.field, reason: err.reason });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid_json' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'payload_too_large' });
  }
  if (err instanceof multer.MulterError) {
    const code = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(code).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'file_too_large' : 'upload_error' });
  }
  console.error('Erreur non gérée :', err && err.message);
  res.status(500).json({ error: 'server_error' });
});

// Purge quotidienne des sessions admin expirées
setInterval(() => {
  db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(now());
}, 3600 * 1000).unref();

const server = app.listen(PORT, () => {
  const address = server.address();
  console.log(`Paris 2026 API en écoute sur le port ${typeof address === 'object' ? address.port : PORT}`);
});

export { app, server };

// Arrêt propre (Docker/systemd envoient SIGTERM)
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    server.close(() => { try { db.close(); } catch { /* déjà fermée */ } process.exit(0); });
  });
}
