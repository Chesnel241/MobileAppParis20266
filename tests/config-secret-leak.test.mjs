import { test } from 'node:test';
import assert from 'node:assert/strict';

// La clé « anon » est renvoyée au navigateur par /api/admin/auth-config.
// Si une clé secrète y était placée, elle serait publiée à tout internet et
// donnerait un accès total à la base (contournement de RLS). Le serveur doit
// refuser de démarrer plutôt que de laisser passer ça.
// Symétriquement, la clé service_role sert aux écritures : une clé publique à
// cette place laisse RLS tout refuser, en silence côté lecture.
const { loadConfig } = await import('../api/lib/config.js');
const { assertServiceKey } = await import('../api/lib/keys.js');

const base = {
  SUPABASE_URL: 'https://projet.supabase.co',
  SUPABASE_ADMIN_EMAILS: 'admin@exemple.fr',
};

// Construit un JWT de test (non signé : seule la charge utile est inspectée).
const jwt = (role) => {
  const part = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${part({ alg: 'HS256' })}.${part({ role })}.signature`;
};

test('une clé secrète nouveau format (sb_secret_) est refusée', () => {
  assert.throws(
    () => loadConfig({ ...base, SUPABASE_ANON_KEY: 'sb_secret_TO6lyd80JbIE_o_KI381TQ' }),
    /clé SECRÈTE/
  );
});

test('une clé service_role (ancien format JWT) est refusée', () => {
  assert.throws(
    () => loadConfig({ ...base, SUPABASE_ANON_KEY: jwt('service_role') }),
    /service_role/
  );
});

test('la clé publiable nouveau format est acceptée', () => {
  const config = loadConfig({ ...base, SUPABASE_ANON_KEY: 'sb_publishable_abc123' });
  assert.equal(config.supabase.anonKey, 'sb_publishable_abc123');
});

test('la clé anon ancien format (JWT role anon) est acceptée', () => {
  const key = jwt('anon');
  const config = loadConfig({ ...base, SUPABASE_ANON_KEY: key });
  assert.equal(config.supabase.anonKey, key);
});

// Le défaut inverse : une clé publique utilisée comme clé serveur. Les lectures
// renvoient zéro ligne (on affiche les valeurs par défaut) et chaque écriture
// est rejetée par RLS — panne invisible jusqu'à la première inscription.
test('une clé publiable placée en service_role est refusée', () => {
  assert.throws(() => assertServiceKey('sb_publishable_abc123'), /PUBLIABLE/);
});

test('une clé anon (JWT) placée en service_role est refusée', () => {
  assert.throws(() => assertServiceKey(jwt('anon')), /service_role/);
});

test('la vraie clé service_role est acceptée', () => {
  const key = jwt('service_role');
  assert.equal(assertServiceKey(key), key);
  assert.equal(assertServiceKey('sb_secret_abc123'), 'sb_secret_abc123');
});
