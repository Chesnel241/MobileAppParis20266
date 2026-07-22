import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// Vérifie l'API Vercel réellement démarrée : routage, authentification,
// validation des entrées et gestion des erreurs. Les accès Supabase ne sont pas
// joignables ici (projet factice) : on teste donc tout ce qui se décide AVANT
// la base, c'est-à-dire l'essentiel des garde-fous de sécurité.
process.env.SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-key';
process.env.SUPABASE_ANON_KEY = 'fake-anon-key';
process.env.SUPABASE_ADMIN_EMAILS = 'admin@exemple.fr';
process.env.ADMIN_CODE = 'Paris#Admin2026!Secure';

const app = (await import('../api/index.js')).default;

let server, base;
before(async () => {
  server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));

async function call(method, path, { body, token, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload = raw;
  if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  if (raw !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(base + path, { method, headers, body: payload });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

test('le service répond et annonce ses méthodes de connexion', async () => {
  const health = await call('GET', '/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);

  const cfg = await call('GET', '/api/admin/auth-config');
  assert.equal(cfg.status, 200);
  assert.equal(cfg.body.codeEnabled, true);
  assert.equal(cfg.body.supabase.url, 'https://fake.supabase.co');
  // La clé service_role ne doit JAMAIS être exposée.
  assert.ok(!JSON.stringify(cfg.body).includes('fake-service-key'));
});

test('les endpoints admin refusent un jeton absent ou mal formé', async () => {
  for (const path of ['/api/admin/questions', '/api/admin/stats', '/api/admin/housing', '/api/admin/photos']) {
    assert.equal((await call('GET', path)).status, 401, path);
    assert.equal((await call('GET', path, { token: 'pas-un-jeton' })).status, 401, path);
  }
});

test('les endpoints participant refusent un jeton absent', async () => {
  assert.equal((await call('GET', '/api/questions/mine')).status, 401);
  assert.equal((await call('GET', '/api/participants/me')).status, 401);
  assert.equal((await call('GET', '/api/participants/me/housing')).status, 401);
  assert.equal((await call('GET', '/api/photos')).status, 401);
});

test('un mauvais code administrateur est rejeté', async () => {
  const res = await call('POST', '/api/admin/login', { body: { code: 'mauvais-code-ici' } });
  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'bad_code');
});

test('les entrées invalides sont rejetées en 400, pas en 500', async () => {
  const cases = [
    ['POST', '/api/participants', { firstName: '', lastName: '', phone: '', country: '' }],
    ['POST', '/api/admin/login', {}],
  ];
  for (const [method, path, body] of cases) {
    const res = await call(method, path, { body });
    assert.equal(res.status, 400, `${path} → ${res.status}`);
  }
});

test('un JSON malformé renvoie 400 et non une erreur serveur', async () => {
  const res = await call('POST', '/api/admin/login', { raw: '{ceci nest pas du json' });
  assert.equal(res.status, 400);
});

test('une route inconnue renvoie 404', async () => {
  assert.equal((await call('GET', '/api/nexiste-pas')).status, 404);
});

test('la clé publique VAPID est exposée, jamais la privée', async () => {
  const res = await call('GET', '/api/push/public-key');
  assert.equal(res.status, 200);
  assert.ok('publicKey' in res.body);
  assert.ok(!JSON.stringify(res.body).toLowerCase().includes('private'));
});

test('les en-têtes de sécurité sont présents', async () => {
  const res = await fetch(base + '/api/health');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(res.headers.get('x-powered-by'), null);
});
