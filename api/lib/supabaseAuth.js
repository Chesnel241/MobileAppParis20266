// Authentification des administrateurs via les comptes Supabase existants
// (ceux du site dlwm-convention2026.fr). Aucun secret Supabase n'est nécessaire :
// on valide le jeton d'accès auprès de Supabase, qui fait autorité.
//
// Le jeton n'est présenté qu'UNE fois, au login : le serveur émet ensuite sa
// propre session admin (table admin_sessions), comme avec le code partagé.
// Les 29 autres endpoints admin restent donc inchangés.

const USER_ENDPOINT = '/auth/v1/user';

/**
 * Valide un jeton d'accès Supabase et renvoie l'utilisateur correspondant.
 * Renvoie null si le jeton est invalide, expiré ou si Supabase est injoignable.
 */
export async function fetchSupabaseUser(accessToken, { url, anonKey, timeoutMs = 8000 } = {}) {
  if (!url || !anonKey || typeof accessToken !== 'string' || !accessToken) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url}${USER_ENDPOINT}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user : null;
  } catch {
    return null; // réseau, timeout, JSON invalide → refus
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Autorisation : être authentifié ne suffit pas, il faut être administrateur.
 * Trois mécanismes cumulables, selon la façon dont vos comptes sont structurés :
 *   - tout compte confirmé du projet (SUPABASE_ADMIN_ANY_ACCOUNT), qui aligne
 *     l'application sur le site de l'événement : là-bas, toute personne
 *     authentifiée entre dans l'espace logistique ;
 *   - liste d'e-mails autorisés (SUPABASE_ADMIN_EMAILS)
 *   - rôle porté par le compte (SUPABASE_ADMIN_ROLE), cherché dans
 *     app_metadata.role, user_metadata.role, ou les tableaux *.roles
 * Sans aucun des trois configuré, on refuse (fail closed) : l'ouverture à tous
 * les comptes doit être un choix explicite, jamais la conséquence d'un oubli.
 */
export function isAuthorizedAdmin(user, { adminEmails = [], adminRole = '', anyAccount = false } = {}) {
  if (!user) return false;
  if (adminEmails.length === 0 && !adminRole && !anyAccount) return false;

  // Un compte non confirmé n'est pas une identité vérifiée : on l'écarte dans
  // tous les cas, y compris en mode « tout compte ».
  const confirmed = Boolean(user.email_confirmed_at || user.confirmed_at || user.phone_confirmed_at);

  if (anyAccount && confirmed) return true;

  if (adminEmails.length > 0) {
    const email = String(user.email || '').trim().toLowerCase();
    if (email && confirmed && adminEmails.includes(email)) return true;
  }

  if (adminRole) {
    const wanted = adminRole.toLowerCase();
    const buckets = [user.app_metadata, user.user_metadata];
    for (const bucket of buckets) {
      if (!bucket || typeof bucket !== 'object') continue;
      const single = bucket.role;
      if (typeof single === 'string' && single.toLowerCase() === wanted) return true;
      const many = bucket.roles;
      if (Array.isArray(many) && many.some(r => String(r).toLowerCase() === wanted)) return true;
    }
  }

  return false;
}

// Le mode « tout compte » n'est légitime que si les comptes sont créés par
// l'organisation. Si l'inscription libre reste ouverte sur le projet Supabase,
// n'importe qui sur internet peut s'octroyer un compte — et donc l'accès
// administrateur. On vérifie donc auprès de Supabase, qui fait autorité.
// Résultat mis en cache : cette réponse ne change qu'au gré d'un réglage manuel.
let signupCache = { value: null, at: 0 };
const SIGNUP_CACHE_MS = 5 * 60 * 1000;

export async function signupIsOpen({ url, anonKey, timeoutMs = 5000 } = {}, now = Date.now()) {
  if (!url || !anonKey) return true; // dans le doute, on considère le risque présent
  if (signupCache.value !== null && now - signupCache.at < SIGNUP_CACHE_MS) return signupCache.value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anonKey }, signal: controller.signal });
    if (!res.ok) return true;
    const settings = await res.json();
    const open = settings.disable_signup === false;
    signupCache = { value: open, at: now };
    return open;
  } catch {
    return true; // injoignable → on refuse plutôt que d'ouvrir en grand
  } finally {
    clearTimeout(timer);
  }
}

/** Réinitialise le cache (tests). */
export function resetSignupCache() {
  signupCache = { value: null, at: 0 };
}

/** Étiquette lisible pour la journalisation / l'affichage (jamais le jeton). */
export function adminLabel(user) {
  return user ? (user.email || user.id) : 'inconnu';
}
