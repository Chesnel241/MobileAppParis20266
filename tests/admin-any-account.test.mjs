import { test } from 'node:test';
import assert from 'node:assert/strict';

// Le mode « tout compte Supabase » aligne l'application sur le site de
// l'événement. Il n'est légitime que si les comptes sont créés par
// l'organisation : sur ce projet, l'inscription libre était ouverte et la clé
// publiable est publiée dans le JavaScript du site.
const { isAuthorizedAdmin } = await import('../api/lib/supabaseAuth.js');
const { loadConfig } = await import('../api/lib/config.js');

const confirme = { id: 'u1', email: 'pasteur@exemple.fr', email_confirmed_at: '2026-07-01T10:00:00Z' };
const nonConfirme = { id: 'u2', email: 'inconnu@exemple.fr', email_confirmed_at: null, confirmed_at: null };

test('sans configuration, aucun compte n’est administrateur', () => {
  assert.equal(isAuthorizedAdmin(confirme, {}), false);
});

test('en mode « tout compte », un compte confirmé est administrateur', () => {
  assert.equal(isAuthorizedAdmin(confirme, { anyAccount: true }), true);
});

test('en mode « tout compte », un compte non confirmé reste refusé', () => {
  assert.equal(isAuthorizedAdmin(nonConfirme, { anyAccount: true }), false);
});

test('la liste blanche continue de fonctionner seule', () => {
  assert.equal(isAuthorizedAdmin(confirme, { adminEmails: ['pasteur@exemple.fr'] }), true);
  assert.equal(isAuthorizedAdmin(confirme, { adminEmails: ['autre@exemple.fr'] }), false);
});

test('le mode doit être demandé explicitement dans la configuration', () => {
  const base = { SUPABASE_URL: 'https://p.supabase.co', SUPABASE_ANON_KEY: 'sb_publishable_x' };
  assert.throws(() => loadConfig(base), /SUPABASE_ADMIN_ANY_ACCOUNT/);
  const config = loadConfig({ ...base, SUPABASE_ADMIN_ANY_ACCOUNT: '1' });
  assert.equal(config.supabase.anyAccount, true);
  assert.equal(loadConfig({ ...base, SUPABASE_ADMIN_ANY_ACCOUNT: 'non' , SUPABASE_ADMIN_EMAILS: 'a@b.fr' }).supabase.anyAccount, false);
});
