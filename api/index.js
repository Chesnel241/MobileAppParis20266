// API de la Convention Paris 2026, en fonction Vercel (Express serverless).
// Données et stockage : Supabase (via le repo, clé service_role). Le client ne
// touche jamais les tables : l'autorisation est faite ici.
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { extname } from 'node:path';
import { loadConfig } from './lib/config.js';
import { fetchSupabaseUser, isAuthorizedAdmin, adminLabel, signupIsOpen } from './lib/supabaseAuth.js';
import { initPush, broadcast } from './lib/push.js';
import { CONTENT_SECTIONS } from './lib/defaults.js';
import * as repo from './lib/repo.js';
import {
  InputValidationError,
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
} from './lib/validation.js';

const config = loadConfig();
initPush(config.vapid);

// Amorçage du contenu (une fois par démarrage à froid).
await repo.seedContent().catch(() => {});

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const AUDIO_EXT = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.opus'];
const IMAGE_MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// En mémoire : les fichiers partent ensuite vers Supabase Storage.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');
app.use(cors(config.corsOrigins.length ? { origin: config.corsOrigins } : {}));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '256kb', strict: false }));

const now = () => new Date().toISOString();
const token = () => randomBytes(24).toString('hex');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';
}
// Limiteur de débit basé sur Supabase (le serverless n'a pas de mémoire partagée).
async function limited(bucket, req, res, max, windowSeconds) {
  const hits = await repo.rateHit(bucket, clientIp(req), windowSeconds);
  if (hits > max) { res.status(429).json({ error: 'too_many_requests' }); return true; }
  return false;
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function bearer(req) {
  const h = req.headers.authorization || '';
  const v = h.startsWith('Bearer ') ? h.slice(7) : null;
  return v && /^[0-9a-f]{48}$/.test(v) ? v : null;
}

const requireParticipant = asyncHandler(async (req, res, next) => {
  const t = bearer(req);
  const p = t && await repo.participantByToken(t);
  if (!p) return res.status(401).json({ error: 'unauthorized' });
  req.participant = p;
  next();
});

const requireAdmin = asyncHandler(async (req, res, next) => {
  const t = bearer(req);
  const s = t && await repo.adminSession(t);
  if (!s || new Date(s.expires_at) < new Date()) {
    if (s) await repo.deleteAdminSession(t);
    return res.status(401).json({ error: 'admin_unauthorized' });
  }
  req.adminToken = t;
  next();
});

// ---------- Santé & contenu ----------
app.get('/api/health', (_req, res) => res.json({ ok: true, time: now() }));
app.get('/api/content', asyncHandler(async (_req, res) => res.json(await repo.getContent())));

// ---------- Authentification admin ----------
app.get('/api/admin/auth-config', (_req, res) => {
  res.json({
    codeEnabled: config.allowAdminCode,
    supabase: config.supabase ? { url: config.supabase.url, anonKey: config.supabase.anonKey } : null,
  });
});

app.post('/api/admin/login', asyncHandler(async (req, res) => {
  if (await limited('admin_login', req, res, 20, 900)) return;
  const { code, supabaseAccessToken } = validateAdminLoginInput(req.body);
  let grantedTo = null;

  if (supabaseAccessToken) {
    if (!config.supabase) return res.status(400).json({ error: 'supabase_not_configured' });
    // Ouvrir l'administration à tout compte n'a de sens que si les comptes sont
    // créés par l'organisation. Tant que l'inscription libre reste ouverte sur
    // le projet Supabase, n'importe qui pourrait s'octroyer l'accès : on refuse.
    if (config.supabase.anyAccount && await signupIsOpen(config.supabase)) {
      console.error('[ADMIN] mode « tout compte » actif alors que l’inscription libre est ouverte sur Supabase.');
      return res.status(503).json({ error: 'signup_open' });
    }
    const user = await fetchSupabaseUser(supabaseAccessToken, config.supabase);
    if (!user) return res.status(401).json({ error: 'bad_supabase_token' });
    // La table app_admins fait autorité et est partagée avec les policies RLS
    // du site : un organisateur déclaré une fois ouvre les deux espaces.
    const inTable = config.supabase.fromTable && await repo.isAppAdmin(user.id);
    if (!inTable && !isAuthorizedAdmin(user, config.supabase)) {
      return res.status(403).json({ error: 'not_an_admin' });
    }
    grantedTo = adminLabel(user);
  } else {
    if (!config.allowAdminCode) return res.status(400).json({ error: 'code_login_disabled' });
    if (!safeEqual(code, config.adminCode)) return res.status(401).json({ error: 'bad_code' });
    grantedTo = 'code partagé';
  }

  const t = token();
  const expires = new Date(Date.now() + config.adminSessionHours * 3600 * 1000).toISOString();
  await repo.createAdminSession(t, expires);
  console.log(`[ADMIN] session ouverte pour ${grantedTo}`);
  res.json({ token: t, expiresAt: expires });
}));

app.post('/api/admin/logout', requireAdmin, asyncHandler(async (req, res) => {
  await repo.deleteAdminSession(req.adminToken);
  res.json({ ok: true });
}));

// ---------- Contenu éditable (admin) ----------
app.put('/api/admin/content/:section', requireAdmin, asyncHandler(async (req, res) => {
  const { section } = req.params;
  if (!CONTENT_SECTIONS.includes(section)) return res.status(400).json({ error: 'unknown_section' });
  const value = validateContentSection(section, req.body);
  await repo.setContentSection(section, value);
  res.json({ ok: true, section });
}));

// ---------- Notifications ----------
app.get('/api/notifications', asyncHandler(async (_req, res) => res.json(await repo.recentNotifications())));

app.post('/api/admin/notifications', requireAdmin, asyncHandler(async (req, res) => {
  const { textFr: fr, textEn: en } = validateNotificationInput(req.body);
  const created = await repo.createNotification({ fr, en });
  const push = await broadcast({ fr, en });
  res.status(201).json({ ...created, push });
}));

// ---------- Push ----------
app.get('/api/push/public-key', (_req, res) => {
  res.json({ publicKey: config.vapid ? config.vapid.publicKey : null });
});
app.post('/api/push/subscribe', requireParticipant, asyncHandler(async (req, res) => {
  if (await limited('push_sub', req, res, 30, 60)) return;
  if (!config.vapid) return res.status(503).json({ error: 'push_not_configured' });
  const { subscription, lang } = validatePushSubscriptionInput(req.body);
  await repo.saveSubscription(subscription, { participantId: req.participant.id, lang: lang === 'en' ? 'en' : 'fr' });
  res.status(201).json({ ok: true });
}));
app.post('/api/push/unsubscribe', requireParticipant, asyncHandler(async (req, res) => {
  const { endpoint } = validatePushUnsubscribeInput(req.body);
  await repo.removeSubscription(endpoint);
  res.json({ ok: true });
}));

// ---------- Participants ----------
app.post('/api/participants', asyncHandler(async (req, res) => {
  if (await limited('register', req, res, 30, 3600)) return;
  const participant = validateParticipantInput(req.body);
  if (await repo.findDuplicateIdentity(participant)) return res.status(409).json({ error: 'duplicate' });
  const t = token();
  const { id } = await repo.createParticipant({ ...participant, token: t });
  await repo.autoLinkParticipant({ id, first_name: participant.firstName, last_name: participant.lastName, phone: participant.phone });
  res.status(201).json({ id, token: t });
}));

app.get('/api/participants/me', requireParticipant, (req, res) => {
  const p = req.participant;
  res.json({ id: p.id, firstName: p.first_name, lastName: p.last_name, phone: p.phone, country: p.country, role: p.role });
});

app.get('/api/participants/me/housing', requireParticipant, asyncHandler(async (req, res) => {
  res.json(await repo.myHousing(req.participant));
}));

app.delete('/api/participants/me', requireParticipant, asyncHandler(async (req, res) => {
  await repo.deleteParticipant(req.participant.id);
  res.json({ ok: true });
}));

// ---------- Questions ----------
app.post('/api/questions', requireParticipant, asyncHandler(async (req, res) => {
  if (await limited('question', req, res, 30, 60)) return;
  const { text } = validateQuestionInput(req.body);
  res.status(201).json(await repo.createQuestion(req.participant.id, text));
}));
app.get('/api/questions/mine', requireParticipant, asyncHandler(async (req, res) => {
  res.json(await repo.myQuestions(req.participant.id));
}));
app.get('/api/admin/questions', requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await repo.adminQuestions());
}));
app.post('/api/admin/questions/:id/assign', requireAdmin, asyncHandler(async (req, res) => {
  const payload = validateQuestionAssignmentInput(req.body);
  const ok = await repo.assignQuestion(req.params.id, payload);
  if (!ok) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
}));

// ---------- Statistiques & check-in ----------
app.get('/api/admin/stats', requireAdmin, asyncHandler(async (_req, res) => res.json(await repo.stats())));
app.post('/api/admin/participants/:id/checkin', requireAdmin, asyncHandler(async (req, res) => {
  await repo.checkinParticipant(req.params.id);
  res.json({ ok: true });
}));
app.get('/api/admin/participants', requireAdmin, asyncHandler(async (_req, res) => res.json(await repo.adminParticipants())));

// ---------- Logements ----------
app.get('/api/admin/housing', requireAdmin, asyncHandler(async (_req, res) => res.json(await repo.listHousing())));
app.post('/api/admin/housing/import', requireAdmin, asyncHandler(async (req, res) => {
  const { rows } = validateHousingImportInput(req.body);
  res.status(201).json(await repo.importHousing(rows));
}));
app.put('/api/admin/housing/:id', requireAdmin, asyncHandler(async (req, res) => {
  const existing = await repo.housingById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const body = validateHousingUpdateInput(req.body);
  res.json(await repo.updateHousing(req.params.id, body, existing));
}));
app.post('/api/admin/housing/:id/link', requireAdmin, asyncHandler(async (req, res) => {
  const existing = await repo.housingById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { participantId } = validateHousingLinkInput(req.body);
  const result = await repo.linkHousing(req.params.id, participantId);
  if (result.error === 'unknown_participant') return res.status(400).json({ error: result.error });
  if (result.error === 'participant_already_linked') return res.status(409).json({ error: result.error });
  res.json(result.housing);
}));
app.delete('/api/admin/housing/:id', requireAdmin, asyncHandler(async (req, res) => {
  await repo.deleteHousing(req.params.id);
  res.json({ ok: true });
}));

// ---------- Médias & pellicule (Supabase Storage) ----------
app.post('/api/admin/media', requireAdmin, upload.single('file'), asyncHandler(async (req, res) => {
  if (await limited('media', req, res, 20, 60)) return;
  if (!req.file) return res.status(400).json({ error: 'missing_file' });
  const kind = req.body?.kind === 'audio' ? 'audio' : 'image';
  const ext = extname(req.file.originalname || '').toLowerCase();
  const allowed = kind === 'audio' ? AUDIO_EXT : IMAGE_EXT;
  if (!allowed.includes(ext)) return res.status(400).json({ error: 'bad_file_type' });
  const contentType = kind === 'audio' ? (req.file.mimetype || 'application/octet-stream') : (IMAGE_MIME[ext] || 'image/jpeg');
  const { url } = await repo.uploadMedia(req.file.buffer, contentType, ext);
  res.status(201).json({ url });
}));

app.post('/api/photos', requireParticipant, upload.single('photo'), asyncHandler(async (req, res) => {
  if (await limited('photo', req, res, 15, 60)) return;
  if (!req.file) return res.status(400).json({ error: 'missing_file' });
  const ext = extname(req.file.originalname || '').toLowerCase() || '.jpg';
  if (!IMAGE_EXT.includes(ext)) return res.status(400).json({ error: 'bad_file_type' });
  // La photo est déjà redimensionnée et filigranée côté client (canvas re-encode
  // le JPEG, ce qui supprime aussi les métadonnées EXIF/GPS).
  const { name } = await repo.uploadMedia(req.file.buffer, IMAGE_MIME[ext] || 'image/jpeg', ext);
  res.status(201).json(await repo.createPhoto(req.participant.id, name));
}));

app.get('/api/photos', requireParticipant, asyncHandler(async (_req, res) => res.json(await repo.listPhotos())));
app.get('/api/admin/photos', requireAdmin, asyncHandler(async (_req, res) => res.json(await repo.adminPhotos())));
app.delete('/api/admin/photos/:id', requireAdmin, asyncHandler(async (req, res) => {
  await repo.deletePhoto(req.params.id);
  res.json({ ok: true });
}));

// ---------- Gestion des erreurs ----------
app.use((err, _req, res, _next) => {
  if (err instanceof InputValidationError) {
    return res.status(400).json({ error: 'invalid_input', details: err.errors });
  }
  // Corps JSON illisible : faute du client, pas du serveur.
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'malformed_json' });
  }
  if (err instanceof multer.MulterError) {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
      .json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'file_too_large' : 'upload_error' });
  }
  console.error('Erreur non gérée :', err && err.message);
  res.status(500).json({ error: 'server_error' });
});

export default app;
