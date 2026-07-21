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

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  return Object.freeze({
    port: integerInRange(env.PORT || 8080, 'PORT', 0, 65535),
    adminCode: assertStrongAdminCode(env.ADMIN_CODE),
    adminSessionHours: numberInRange(env.ADMIN_SESSION_HOURS || 24, 'ADMIN_SESSION_HOURS', 0.25, 168),
    uploadsDir: env.UPLOADS_DIR || './data/uploads',
    corsOrigins: parseCorsOrigins(env.CORS_ORIGINS, production),
  });
}

const config = loadConfig();

export default config;
