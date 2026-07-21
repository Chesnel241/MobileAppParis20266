import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import sharp from 'sharp';

const serverDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const runtimeRoot = mkdtempSync(join(tmpdir(), 'paris-2026-server-test-'));
const uploadsDirectory = join(runtimeRoot, 'uploads');
const databasePath = join(runtimeRoot, 'integration.db');
const ADMIN_CODE = 'Paris#Admin2026!Secure';

let server;
let db;
let baseUrl;
let adminToken;
let participant;
let questionId;
let housingId;
let photo;
let photoPath;

async function api(path, { method = 'GET', body, raw, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let requestBody;
  if (form) {
    requestBody = form;
  } else if (raw !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = raw;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: requestBody });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  return { status: response.status, data, headers: response.headers };
}

before(async () => {
  process.env.PORT = '0';
  process.env.ADMIN_CODE = ADMIN_CODE;
  process.env.ADMIN_SESSION_HOURS = '1';
  process.env.DB_PATH = databasePath;
  process.env.UPLOADS_DIR = uploadsDirectory;
  process.env.CORS_ORIGINS = 'https://app.example.test';

  ({ server } = await import('../src/index.js'));
  if (!server.listening) await once(server, 'listening');
  ({ default: db } = await import('../src/db.js'));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  try { db?.close(); } catch { /* déjà fermée */ }
  rmSync(runtimeRoot, { recursive: true, force: true });
});

test('le démarrage refuse un ADMIN_CODE absent, d’exemple ou faible', () => {
  const cases = [undefined, 'LWMFD2026', 'CHANGE_ME_WITH_A_RANDOM_SECRET_32_CHARS', 'Weak123!'];
  for (const [index, code] of cases.entries()) {
    const env = {
      ...process.env,
      PORT: '0',
      DB_PATH: join(runtimeRoot, `startup-${index}.db`),
      UPLOADS_DIR: join(runtimeRoot, `startup-uploads-${index}`),
    };
    if (code === undefined) delete env.ADMIN_CODE;
    else env.ADMIN_CODE = code;
    const result = spawnSync(process.execPath, ['src/index.js'], {
      cwd: serverDirectory,
      env,
      encoding: 'utf8',
      timeout: 4000,
    });
    assert.equal(result.error?.code, undefined, `le processus ne doit pas rester démarré pour ${String(code)}`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[CONFIG\].*ADMIN_CODE/);
    assert.doesNotMatch(result.stdout, /API en écoute/);
  }
});

test('la migration photo est idempotente et conserve les anciennes photos approuvées', () => {
  const legacyPath = join(runtimeRoot, 'legacy.db');
  const legacy = new Database(legacyPath);
  legacy.exec(`
    CREATE TABLE photos (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      file TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    INSERT INTO photos (id, participant_id, file, created_at)
    VALUES ('old-photo', 'old-participant', 'old.jpg', '2026-01-01T00:00:00.000Z');
  `);
  legacy.close();

  const script = "import('./src/db.js').then(({default:db})=>{const row=db.prepare('SELECT status FROM photos WHERE id=?').get('old-photo');console.log(row.status);db.close();})";
  for (let run = 0; run < 2; run += 1) {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: serverDirectory,
      env: { ...process.env, DB_PATH: legacyPath },
      encoding: 'utf8',
      timeout: 4000,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'approved');
  }
});

test('le serveur renvoie 400 pour un JSON malformé', async () => {
  const result = await api('/api/participants', { method: 'POST', raw: '{' });
  assert.equal(result.status, 400);
  assert.equal(result.data.error, 'invalid_json');
});

test('la session admin peut être créée puis révoquée immédiatement', async () => {
  let result = await api('/api/admin/login', { method: 'POST', body: { code: 'x'.repeat(257) } });
  assert.equal(result.status, 400);

  result = await api('/api/admin/login', { method: 'POST', body: { code: 'Wrong#Admin2026!Code' } });
  assert.equal(result.status, 401);

  result = await api('/api/admin/login', { method: 'POST', body: { code: ADMIN_CODE } });
  assert.equal(result.status, 200);
  const revokedToken = result.data.token;
  assert.match(revokedToken, /^[0-9a-f]{48}$/);

  result = await api('/api/admin/logout', { method: 'POST', token: revokedToken });
  assert.equal(result.status, 200);
  result = await api('/api/admin/stats', { token: revokedToken });
  assert.equal(result.status, 401);

  result = await api('/api/admin/login', { method: 'POST', body: { code: ADMIN_CODE } });
  assert.equal(result.status, 200);
  adminToken = result.data.token;
});

test('l’inscription valide téléphone/pays, borne les champs et refuse les doublons', async () => {
  let result = await api('/api/participants', {
    method: 'POST',
    body: { firstName: 'Élise', lastName: 'Durand', phone: 'pas-un-numéro', country: 'FR' },
  });
  assert.equal(result.status, 400);
  assert.equal(result.data.field, 'phone');

  result = await api('/api/participants', {
    method: 'POST',
    body: { firstName: 'Élise', lastName: 'Durand', phone: '+33 6 12 34 56 78', country: 'ZZ' },
  });
  assert.equal(result.status, 400);
  assert.equal(result.data.reason, 'unknown_country');

  result = await api('/api/participants', {
    method: 'POST',
    body: { firstName: 'Élise', lastName: 'Durand', phone: '+33 6 12 34 56 78', country: 'fr' },
  });
  assert.equal(result.status, 201);
  participant = result.data;

  result = await api('/api/participants', {
    method: 'POST',
    body: { firstName: 'Elise', lastName: 'DURAND', phone: '+33 (6) 12-34-56-78', country: 'FR' },
  });
  assert.equal(result.status, 409);
  assert.equal(result.data.error, 'participant_already_exists');

  result = await api('/api/admin/stats', { token: adminToken });
  assert.equal(result.status, 200);
  assert.equal(result.data.registered, 1);
  assert.equal(result.data.checkins, 0, 'une inscription ne doit jamais créer un check-in');
});

test('les questions et actions admin sont bornées et le parcours principal fonctionne', async () => {
  let result = await api('/api/questions', {
    method: 'POST', token: participant.token, body: { text: 'x'.repeat(2001), consent: true },
  });
  assert.equal(result.status, 400);

  result = await api('/api/questions', {
    method: 'POST', token: participant.token, body: { text: 'Je souhaite parler à un pasteur.', consent: true },
  });
  assert.equal(result.status, 201);
  questionId = result.data.id;

  result = await api(`/api/admin/questions/${questionId}/assign`, {
    method: 'POST', token: adminToken,
    body: { pastorName: 'x'.repeat(121), place: 'Salle A', time: '14:00' },
  });
  assert.equal(result.status, 400);

  result = await api(`/api/admin/questions/${questionId}/assign`, {
    method: 'POST', token: adminToken,
    body: { pastorName: 'Pasteur Martin', place: 'Salle A', time: '14:00' },
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.status, 'assigned');

  result = await api('/api/admin/notifications', {
    method: 'POST', token: adminToken, body: { textFr: 'x'.repeat(1001), textEn: '' },
  });
  assert.equal(result.status, 400);
  result = await api('/api/admin/notifications', {
    method: 'POST', token: adminToken, body: { textFr: 'Bienvenue !', textEn: '' },
  });
  assert.equal(result.status, 201);
  assert.equal(result.data.en, 'Bienvenue !');
});

test('le logement ne se lie jamais automatiquement et la liaison manuelle reste disponible', async () => {
  let result = await api('/api/admin/housing/import', {
    method: 'POST', token: adminToken,
    body: {
      rows: [{
        firstName: 'Élise', lastName: 'Durand', phone: '+33 6 12 34 56 78',
        country: 'FR', address: '10 rue de Paris, 75001 Paris', notes: 'Chambre 4',
      }],
    },
  });
  assert.equal(result.status, 201);
  assert.deepEqual(result.data, { created: 1, linked: 0 });

  result = await api('/api/admin/housing', { token: adminToken });
  assert.equal(result.status, 200);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].participant, null);
  housingId = result.data[0].id;

  result = await api('/api/participants/me/housing', { token: participant.token });
  assert.equal(result.status, 200);
  assert.equal(result.data, null);

  result = await api(`/api/admin/housing/${housingId}`, {
    method: 'PUT', token: adminToken, body: { notes: 'x'.repeat(1001) },
  });
  assert.equal(result.status, 400);

  result = await api(`/api/admin/housing/${housingId}/link`, {
    method: 'POST', token: adminToken, body: { participantId: participant.id },
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.participant.id, participant.id);

  result = await api('/api/participants/me/housing', { token: participant.token });
  assert.equal(result.status, 200);
  assert.equal(result.data.id, housingId);
});

test('le check-in admin est explicite et idempotent', async () => {
  let result = await api(`/api/admin/participants/${participant.id}/checkin`, {
    method: 'POST', token: adminToken,
  });
  assert.equal(result.status, 201);
  assert.equal(result.data.created, true);

  const firstCreatedAt = result.data.createdAt;
  result = await api(`/api/admin/participants/${participant.id}/checkin`, {
    method: 'POST', token: adminToken,
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.created, false);
  assert.equal(result.data.createdAt, firstCreatedAt);

  result = await api('/api/admin/stats', { token: adminToken });
  assert.equal(result.data.checkins, 1);
  assert.equal(result.data.attendanceRate, 100);
});

test('chaque section de contenu applique un schéma strict avant écriture', async () => {
  const current = await api('/api/content');
  assert.equal(current.status, 200);
  const content = current.data;
  const invalid = {
    countdownTargetISO: '2026-02-31T10:00',
    days: [{ ...content.days[0], unexpected: true }],
    sessions: [{ ...content.sessions[0], endISO: content.sessions[0].startISO }],
    sejour: { ...content.sejour, unexpected: true },
    paris: { ...content.paris, transport: { ...content.paris.transport, line1: { fr: '', en: 'Metro' } } },
    audios: [{ ...content.audios[0], duration: 'inconnue' }],
    about: { ...content.about, email: 'adresse-invalide' },
  };

  for (const [section, value] of Object.entries(invalid)) {
    const result = await api(`/api/admin/content/${section}`, {
      method: 'PUT', token: adminToken, body: value,
    });
    assert.equal(result.status, 400, `${section} doit refuser un contenu invalide`);
  }

  for (const section of Object.keys(invalid)) {
    const result = await api(`/api/admin/content/${section}`, {
      method: 'PUT', token: adminToken, body: content[section],
    });
    assert.equal(result.status, 200, `${section} doit accepter son schéma valide`);
  }
});

test('les nouvelles photos restent en attente jusqu’à approbation admin', async () => {
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: { r: 40, g: 120, b: 200 } },
  }).png().toBuffer();
  const form = new FormData();
  form.append('photo', new Blob([png], { type: 'image/png' }), 'photo.png');
  form.append('consent', 'true');

  let result = await api('/api/photos', { method: 'POST', token: participant.token, form });
  assert.equal(result.status, 201);
  assert.equal(result.data.status, 'pending');
  photo = result.data;
  photoPath = join(uploadsDirectory, basename(photo.url));
  assert.equal(existsSync(photoPath), true);

  result = await api('/api/photos', { token: participant.token });
  assert.equal(result.status, 200);
  assert.equal(result.data.some(item => item.id === photo.id), false);

  result = await api('/api/admin/photos', { token: adminToken });
  assert.equal(result.status, 200);
  assert.equal(result.data.find(item => item.id === photo.id)?.status, 'pending');

  result = await api(`/api/admin/photos/${photo.id}/approve`, { method: 'POST', token: adminToken });
  assert.equal(result.status, 200);
  assert.equal(result.data.changed, true);
  result = await api(`/api/admin/photos/${photo.id}/approve`, { method: 'POST', token: adminToken });
  assert.equal(result.status, 200);
  assert.equal(result.data.changed, false);

  result = await api('/api/photos', { token: participant.token });
  assert.equal(result.status, 200);
  assert.equal(result.data.some(item => item.id === photo.id), true);
});

test('la suppression du compte cascade les données, révoque le jeton et efface les photos', async () => {
  let result = await api('/api/participants/me', { method: 'DELETE', token: participant.token });
  assert.equal(result.status, 200);
  assert.deepEqual(result.data, { ok: true });
  assert.equal(existsSync(photoPath), false);

  result = await api('/api/participants/me', { token: participant.token });
  assert.equal(result.status, 401);

  result = await api('/api/admin/participants', { token: adminToken });
  assert.equal(result.data.some(item => item.id === participant.id), false);
  result = await api('/api/admin/questions', { token: adminToken });
  assert.equal(result.data.some(item => item.id === questionId), false);
  result = await api('/api/admin/photos', { token: adminToken });
  assert.equal(result.data.some(item => item.id === photo.id), false);
  result = await api('/api/admin/housing', { token: adminToken });
  assert.equal(result.data.find(item => item.id === housingId)?.participant, null);

  result = await api('/api/admin/stats', { token: adminToken });
  assert.equal(result.data.registered, 0);
  assert.equal(result.data.checkins, 0);
  assert.equal(result.data.received, 0);

  const mediaResponse = await fetch(`${baseUrl}${photo.url}`);
  assert.equal(mediaResponse.status, 404);
});
