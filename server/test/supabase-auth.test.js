import { test } from 'node:test';
import assert from 'node:assert/strict';

// config.js évalue la configuration au chargement : on fournit un secret valide
// avant l'import, comme le fait test/config-validation.test.js.
process.env.ADMIN_CODE ||= 'Paris#Admin2026!Secure';
const { isAuthorizedAdmin, adminLabel } = await import('../src/supabaseAuth.js');
const { loadConfig } = await import('../src/config.js');

const STRONG_CODE = 'Xk7#pQ2vLm9!zRt4';
const baseEnv = { ADMIN_CODE: STRONG_CODE, CORS_ORIGINS: 'https://api.exemple.fr' };
const confirmed = (extra = {}) => ({ id: 'u1', email: 'admin@exemple.fr', email_confirmed_at: '2026-01-01T00:00:00Z', ...extra });

test("l'autorisation échoue en l'absence de tout critère (fail closed)", () => {
  assert.equal(isAuthorizedAdmin(confirmed(), {}), false);
  assert.equal(isAuthorizedAdmin(confirmed(), { adminEmails: [], adminRole: '' }), false);
});

test("un e-mail de la liste autorise, un autre non", () => {
  const opts = { adminEmails: ['admin@exemple.fr'], adminRole: '' };
  assert.equal(isAuthorizedAdmin(confirmed(), opts), true);
  assert.equal(isAuthorizedAdmin(confirmed({ email: 'intrus@exemple.fr' }), opts), false);
});

test("un e-mail non confirmé est refusé", () => {
  const opts = { adminEmails: ['admin@exemple.fr'], adminRole: '' };
  assert.equal(isAuthorizedAdmin(confirmed({ email_confirmed_at: null }), opts), false);
});

test("le rôle est reconnu dans app_metadata comme dans user_metadata, chaîne ou tableau", () => {
  const opts = { adminEmails: [], adminRole: 'admin' };
  assert.equal(isAuthorizedAdmin(confirmed({ app_metadata: { role: 'admin' } }), opts), true);
  assert.equal(isAuthorizedAdmin(confirmed({ user_metadata: { role: 'ADMIN' } }), opts), true);
  assert.equal(isAuthorizedAdmin(confirmed({ app_metadata: { roles: ['viewer', 'admin'] } }), opts), true);
  assert.equal(isAuthorizedAdmin(confirmed({ app_metadata: { role: 'viewer' } }), opts), false);
  assert.equal(isAuthorizedAdmin(confirmed(), opts), false);
});

test("un utilisateur absent est toujours refusé", () => {
  assert.equal(isAuthorizedAdmin(null, { adminEmails: ['a@b.fr'] }), false);
  assert.equal(adminLabel(null), 'inconnu');
  assert.equal(adminLabel({ email: 'a@b.fr' }), 'a@b.fr');
});

test('la configuration Supabase exige une clé anonyme', () => {
  assert.throws(
    () => loadConfig({ ...baseEnv, SUPABASE_URL: 'https://proj.supabase.co' }),
    /SUPABASE_ANON_KEY/
  );
});

test("la configuration Supabase exige un critère d'administration", () => {
  assert.throws(
    () => loadConfig({ ...baseEnv, SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_ANON_KEY: 'anon' }),
    /SUPABASE_ADMIN_EMAILS/
  );
});

test('la configuration Supabase refuse une URL non HTTPS', () => {
  assert.throws(
    () => loadConfig({ ...baseEnv, SUPABASE_URL: 'http://proj.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_ADMIN_ROLE: 'admin' }),
    /HTTPS/
  );
});

test('une configuration Supabase complète est acceptée et normalisée', () => {
  const config = loadConfig({
    ...baseEnv,
    SUPABASE_URL: 'https://proj.supabase.co/',
    SUPABASE_ANON_KEY: 'anon',
    SUPABASE_ADMIN_EMAILS: ' Admin@Exemple.FR , second@exemple.fr ',
  });
  assert.equal(config.supabase.url, 'https://proj.supabase.co');
  assert.deepEqual(config.supabase.adminEmails, ['admin@exemple.fr', 'second@exemple.fr']);
  assert.equal(config.allowAdminCode, true);
});

test('désactiver le code partagé sans Supabase est refusé (sinon plus aucun accès admin)', () => {
  assert.throws(
    () => loadConfig({ ...baseEnv, ALLOW_ADMIN_CODE: 'false' }),
    /ALLOW_ADMIN_CODE/
  );
});

test('avec Supabase, le code partagé peut être désactivé et ADMIN_CODE devient inutile', () => {
  const config = loadConfig({
    CORS_ORIGINS: 'https://api.exemple.fr',
    ALLOW_ADMIN_CODE: 'false',
    SUPABASE_URL: 'https://proj.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    SUPABASE_ADMIN_ROLE: 'admin',
  });
  assert.equal(config.allowAdminCode, false);
  assert.equal(config.adminCode, null);
});

// --- Validation du jeton auprès de Supabase (faux serveur local) ---
const { fetchSupabaseUser } = await import('../src/supabaseAuth.js');
const { createServer } = await import('node:http');

test('fetchSupabaseUser renvoie l’utilisateur pour un jeton valide, null sinon', async () => {
  const users = {
    'tok-admin': { id: 'u1', email: 'admin@exemple.fr', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { role: 'admin' } },
  };
  const server = createServer((req, res) => {
    const tok = (req.headers.authorization || '').replace('Bearer ', '');
    const u = users[tok];
    res.writeHead(u ? 200 : 401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(u || { error: 'invalid' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const opts = { url, anonKey: 'anon' };

  try {
    const ok = await fetchSupabaseUser('tok-admin', opts);
    assert.equal(ok.email, 'admin@exemple.fr');
    assert.equal(isAuthorizedAdmin(ok, { adminEmails: [], adminRole: 'admin' }), true);

    assert.equal(await fetchSupabaseUser('tok-inconnu', opts), null);
    assert.equal(await fetchSupabaseUser('', opts), null);
    assert.equal(await fetchSupabaseUser('tok-admin', { url: '', anonKey: '' }), null);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('fetchSupabaseUser renvoie null si Supabase est injoignable (pas de blocage)', async () => {
  const res = await fetchSupabaseUser('tok', { url: 'http://127.0.0.1:1', anonKey: 'anon', timeoutMs: 1500 });
  assert.equal(res, null);
});
