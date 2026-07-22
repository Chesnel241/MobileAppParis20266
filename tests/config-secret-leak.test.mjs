import { test } from 'node:test';
import assert from 'node:assert/strict';

// La clé « anon » est renvoyée au navigateur par /api/admin/auth-config.
// Si une clé secrète y était placée, elle serait publiée à tout internet et
// donnerait un accès total à la base (contournement de RLS). Le serveur doit
// refuser de démarrer plutôt que de laisser passer ça.
const { loadConfig } = await import('../api/lib/config.js');

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
