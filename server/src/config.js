const REJECTED_ADMIN_CODES = new Set([
  'LWMFD2026',
  'CHANGE_ME_WITH_A_RANDOM_SECRET_32_CHARS',
  'CHANGEME',
  'ADMIN',
  'PASSWORD',
]);

function configError(message) {
  throw new Error(`[CONFIG] ${message}`);
}

export function assertStrongAdminCode(value) {
  if (typeof value !== 'string' || !value) {
    configError('ADMIN_CODE est obligatoire. Le serveur refuse de démarrer sans secret administrateur.');
  }
  if (value !== value.trim()) configError('ADMIN_CODE ne doit pas commencer ou finir par des espaces.');
  if (value.length < 16) configError('ADMIN_CODE doit contenir au moins 16 caractères.');
  if (value.length > 256) configError('ADMIN_CODE dépasse la longueur maximale de 256 caractères.');
  if (REJECTED_ADMIN_CODES.has(value.toUpperCase()) || /change.?me|example|password|admin123/i.test(value)) {
    configError("ADMIN_CODE utilise une valeur d'exemple ou trop prévisible.");
  }
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  if (!classes.every(pattern => pattern.test(value)) || new Set(value).size < 10) {
    configError('ADMIN_CODE est trop faible (minuscules, majuscules, chiffres et symboles distincts requis).');
  }
  return value;
}

function integerInRange(value, name, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    configError(`${name} doit être un entier compris entre ${min} et ${max}.`);
  }
  return parsed;
}

function numberInRange(value, name, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    configError(`${name} doit être un nombre compris entre ${min} et ${max}.`);
  }
  return parsed;
}

function parseCorsOrigins(value, production) {
  const origins = String(value || '').split(',').map(origin => origin.trim()).filter(Boolean);
  if (production && origins.length === 0) {
    configError('CORS_ORIGINS est obligatoire en production (domaine public et origines Capacitor).');
  }
  for (const origin of origins) {
    let parsed;
    try { parsed = new URL(origin); } catch { configError(`Origine CORS invalide : ${origin}`); }
    const localHttp = parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (!['https:', 'capacitor:'].includes(parsed.protocol) && !localHttp) {
      configError(`Origine CORS non sécurisée : ${origin}`);
    }
  }
  return origins;
}

function parseAdminEmails(value) {
  return String(value || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

// Authentification des admins par leurs comptes Supabase existants (optionnelle).
function parseSupabase(env) {
  const rawUrl = String(env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  if (!rawUrl) return null;

  let parsed;
  try { parsed = new URL(rawUrl); } catch { configError('SUPABASE_URL doit être une URL valide.'); }
  if (parsed.protocol !== 'https:') configError('SUPABASE_URL doit utiliser HTTPS.');

  const anonKey = String(env.SUPABASE_ANON_KEY || '').trim();
  if (!anonKey) configError('SUPABASE_ANON_KEY est obligatoire dès que SUPABASE_URL est défini.');

  const adminEmails = parseAdminEmails(env.SUPABASE_ADMIN_EMAILS);
  const adminRole = String(env.SUPABASE_ADMIN_ROLE || '').trim();
  // Fail closed : sans critère d'autorisation, tout compte Supabase deviendrait admin.
  if (adminEmails.length === 0 && !adminRole) {
    configError(
      'Définissez SUPABASE_ADMIN_EMAILS et/ou SUPABASE_ADMIN_ROLE : sans critère, '
      + "n'importe quel compte du projet Supabase deviendrait administrateur."
    );
  }
  return Object.freeze({ url: rawUrl, anonKey, adminEmails: Object.freeze(adminEmails), adminRole });
}

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const supabase = parseSupabase(env);
  // Le code partagé reste actif par défaut ; il ne peut être désactivé que si
  // Supabase prend le relais, pour ne jamais se retrouver sans accès admin.
  const allowAdminCode = String(env.ALLOW_ADMIN_CODE || 'true').toLowerCase() !== 'false';
  if (!allowAdminCode && !supabase) {
    configError('ALLOW_ADMIN_CODE=false exige une configuration Supabase, sinon aucun accès administrateur ne serait possible.');
  }

  return Object.freeze({
    port: integerInRange(env.PORT || 8080, 'PORT', 0, 65535),
    adminCode: allowAdminCode ? assertStrongAdminCode(env.ADMIN_CODE) : null,
    allowAdminCode,
    supabase,
    adminSessionHours: numberInRange(env.ADMIN_SESSION_HOURS || 24, 'ADMIN_SESSION_HOURS', 0.25, 168),
    uploadsDir: env.UPLOADS_DIR || './data/uploads',
    corsOrigins: parseCorsOrigins(env.CORS_ORIGINS, production),
  });
}

const config = loadConfig();

export default config;
