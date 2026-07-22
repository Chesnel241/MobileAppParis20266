// Configuration des fonctions Vercel. Lue une fois par démarrage à froid.
// La clé service_role est gérée dans supabase.js ; ici on gère l'admin, le push,
// les origines CORS et les sessions.

import { assertPublishableKey } from './keys.js';

function fail(message) {
  throw new Error(`[CONFIG] ${message}`);
}

function parseAdminEmails(value) {
  return String(value || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

function parseSupabaseAuth(env) {
  const url = String(env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const anonKey = assertPublishableKey(String(env.SUPABASE_ANON_KEY || '').trim());
  if (!url || !anonKey) return null;
  const adminEmails = parseAdminEmails(env.SUPABASE_ADMIN_EMAILS);
  const adminRole = String(env.SUPABASE_ADMIN_ROLE || '').trim();
  // Ouvrir l'administration à tout compte du projet doit être un choix assumé,
  // écrit noir sur blanc dans la configuration — jamais un effet de bord.
  const anyAccount = /^(1|true|oui|yes)$/i.test(String(env.SUPABASE_ADMIN_ANY_ACCOUNT || '').trim());
  if (adminEmails.length === 0 && !adminRole && !anyAccount) {
    fail("SUPABASE_ADMIN_EMAILS, SUPABASE_ADMIN_ROLE ou SUPABASE_ADMIN_ANY_ACCOUNT requis, "
      + "sinon tout compte deviendrait admin sans que personne ne l'ait décidé.");
  }
  return Object.freeze({ url, anonKey, adminEmails: Object.freeze(adminEmails), adminRole, anyAccount });
}

function parseVapid(env) {
  const publicKey = String(env.VAPID_PUBLIC_KEY || '').trim();
  const privateKey = String(env.VAPID_PRIVATE_KEY || '').trim();
  if (!publicKey && !privateKey) return null;
  if (!publicKey || !privateKey) fail('VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY doivent être définies ensemble.');
  const subject = String(env.VAPID_SUBJECT || '').trim();
  if (!/^(mailto:|https:\/\/)/.test(subject)) fail('VAPID_SUBJECT doit commencer par mailto: ou https://');
  return Object.freeze({ publicKey, privateKey, subject });
}

function parseAdminCode(value) {
  const code = String(value || '').trim();
  if (!code) return null;
  if (code.length < 16) fail('ADMIN_CODE doit contenir au moins 16 caractères.');
  return code;
}

export function loadConfig(env = process.env) {
  const supabaseAuth = parseSupabaseAuth(env);
  const adminCode = parseAdminCode(env.ADMIN_CODE);
  if (!supabaseAuth && !adminCode) {
    fail('Aucune méthode admin : définissez SUPABASE_ADMIN_EMAILS (via Supabase) ou ADMIN_CODE.');
  }
  return Object.freeze({
    adminCode,
    allowAdminCode: Boolean(adminCode),
    supabase: supabaseAuth,
    vapid: parseVapid(env),
    adminSessionHours: Number(env.ADMIN_SESSION_HOURS || 24),
    corsOrigins: String(env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
  });
}
