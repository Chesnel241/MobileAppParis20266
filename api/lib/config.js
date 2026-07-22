// Configuration des fonctions Vercel. Lue une fois par démarrage à froid.
// La clé service_role est gérée dans supabase.js ; ici on gère l'admin, le push,
// les origines CORS et les sessions.

function fail(message) {
  throw new Error(`[CONFIG] ${message}`);
}

function parseAdminEmails(value) {
  return String(value || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

// La clé « anon » est transmise au navigateur : elle DOIT être publique.
// Ce contrôle empêche qu'une clé secrète (accès total, contournement de RLS)
// soit exposée par mégarde via /api/admin/auth-config.
function assertPublishableKey(key) {
  if (key.startsWith('sb_secret_')) {
    fail('SUPABASE_ANON_KEY contient une clé SECRÈTE (sb_secret_…). '
      + 'Utilisez la clé publiable (sb_publishable_… ou la clé « anon public »). '
      + 'Révoquez immédiatement la clé secrète exposée dans Supabase.');
  }
  // Ancien format : JWT dont le rôle est inscrit dans la charge utile.
  if (key.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString('utf8'));
      if (payload.role && payload.role !== 'anon') {
        fail(`SUPABASE_ANON_KEY porte le rôle « ${payload.role} » au lieu de « anon ». `
          + 'Cette clé ne doit jamais être exposée au navigateur.');
      }
    } catch (error) {
      if (String(error.message).startsWith('[CONFIG]')) throw error;
      // Jeton illisible : on ne bloque pas, la clé sera simplement refusée par Supabase.
    }
  }
  return key;
}

function parseSupabaseAuth(env) {
  const url = String(env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const anonKey = assertPublishableKey(String(env.SUPABASE_ANON_KEY || '').trim());
  if (!url || !anonKey) return null;
  const adminEmails = parseAdminEmails(env.SUPABASE_ADMIN_EMAILS);
  const adminRole = String(env.SUPABASE_ADMIN_ROLE || '').trim();
  if (adminEmails.length === 0 && !adminRole) {
    fail("SUPABASE_ADMIN_EMAILS et/ou SUPABASE_ADMIN_ROLE requis, sinon tout compte deviendrait admin.");
  }
  return Object.freeze({ url, anonKey, adminEmails: Object.freeze(adminEmails), adminRole });
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
