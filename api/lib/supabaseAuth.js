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
 * Deux mécanismes cumulables, selon la façon dont vos comptes sont structurés :
 *   - liste d'e-mails autorisés (SUPABASE_ADMIN_EMAILS)
 *   - rôle porté par le compte (SUPABASE_ADMIN_ROLE), cherché dans
 *     app_metadata.role, user_metadata.role, ou les tableaux *.roles
 * Sans aucun des deux configuré, on refuse (fail closed) : sinon n'importe quel
 * compte du projet Supabase deviendrait administrateur de l'application.
 */
export function isAuthorizedAdmin(user, { adminEmails = [], adminRole = '' } = {}) {
  if (!user) return false;
  if (adminEmails.length === 0 && !adminRole) return false;

  if (adminEmails.length > 0) {
    const email = String(user.email || '').trim().toLowerCase();
    if (email && user.email_confirmed_at !== null && adminEmails.includes(email)) return true;
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

/** Étiquette lisible pour la journalisation / l'affichage (jamais le jeton). */
export function adminLabel(user) {
  return user ? (user.email || user.id) : 'inconnu';
}
