import { assertValidContent } from '../src/data/contentValidation.js';

const apiUrl = String(process.env.VITE_API_URL || '').replace(/\/$/, '');
const fail = (message) => {
  console.error(`\n[RELEASE BLOQUÉE] ${message}\n`);
  process.exit(1);
};

if (!apiUrl) fail('VITE_API_URL est obligatoire pour un build destiné aux stores.');

let parsed;
try { parsed = new URL(apiUrl); } catch { fail('VITE_API_URL doit être une URL valide.'); }
if (parsed.protocol !== 'https:') fail('VITE_API_URL doit utiliser HTTPS.');
if (parsed.username || parsed.password) fail('VITE_API_URL ne doit contenir aucun identifiant.');
if (['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
  fail('VITE_API_URL ne peut pas viser une machine locale.');
}
if (process.env.RELEASE_CONFIRM_CONTENT !== 'YES') {
  fail('Relisez tout le programme, les lieux et les contacts, puis définissez RELEASE_CONFIRM_CONTENT=YES.');
}
if (process.env.RELEASE_CONFIRM_PRIVACY !== 'YES') {
  fail('Validez la politique de confidentialité et les déclarations stores, puis définissez RELEASE_CONFIRM_PRIVACY=YES.');
}

const get = async (path) => {
  let response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    fail(`${path} est inaccessible : ${error.message}`);
  }
  if (!response.ok) fail(`${path} répond HTTP ${response.status}.`);
  return response;
};

const healthResponse = await get('/api/health');
const health = await healthResponse.json().catch(() => null);
if (health?.ok !== true) fail('/api/health ne confirme pas un service sain.');

const requiredHeaders = [
  ['x-content-type-options', 'nosniff'],
  ['content-security-policy', null],
  ['permissions-policy', null],
  ['strict-transport-security', null],
];
for (const [header, expected] of requiredHeaders) {
  const value = healthResponse.headers.get(header);
  if (!value || (expected && value.toLowerCase() !== expected)) {
    fail(`L'en-tête de sécurité ${header} est absent ou invalide.`);
  }
}

const content = await (await get('/api/content')).json().catch(() => null);
try {
  assertValidContent(content, { requireCompleteSchedule: true });
} catch (error) {
  fail(error.validationErrors?.join('\n- ') || error.message);
}

const placeholder = /(à confirmer|a confirmer|à venir|coming soon|\btbd\b|\btodo\b|placeholder|votre-domaine|example\.(com|test))/i;
const inspect = (value, path = 'content') => {
  if (typeof value === 'string' && placeholder.test(value)) fail(`${path} contient un texte provisoire : « ${value} »`);
  if (Array.isArray(value)) value.forEach((item, index) => inspect(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => inspect(item, `${path}.${key}`));
  }
};
inspect(content);

const latestSession = Math.max(...content.sessions.map(session => Date.parse(session.endISO)));
if (!Number.isFinite(latestSession) || latestSession <= Date.now()) {
  fail('Toutes les sessions sont terminées ou leurs dates sont invalides.');
}

const privacyResponse = await fetch(`${apiUrl}/privacy.html`, { signal: AbortSignal.timeout(10_000) }).catch(() => null);
if (!privacyResponse?.ok) fail('La politique de confidentialité publique /privacy.html est inaccessible.');

console.log(`Préflight release réussi pour ${apiUrl}`);
