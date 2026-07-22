// Résolution de la cible de l'API, isolée pour être testable hors navigateur.
//
// Règle : une application servie depuis un vrai domaine parle toujours à son
// propre domaine, même si VITE_API_URL manquait au moment du build. Un oubli de
// variable d'environnement ne doit jamais produire une application d'apparence
// normale mais déconnectée (inscriptions perdues, programme figé, aucune
// notification) — c'est arrivé en production le 22 juillet 2026.

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|\[::1\])$/;

// Vrai uniquement pour une page web publiée : les applications natives
// (capacitor://, file://) et le développement local en sont exclus.
export function isDeployedWebOrigin(location) {
  if (!location) return false;
  const { protocol, hostname } = location;
  if (protocol !== 'http:' && protocol !== 'https:') return false;
  return !LOCAL_HOSTS.test(String(hostname || ''));
}

export function resolveApiTarget(rawValue, location) {
  const raw = String(rawValue || '').trim();
  const sameOrigin = raw === 'same-origin' || raw === '/'
    || (raw === '' && isDeployedWebOrigin(location));
  const url = sameOrigin ? '' : raw.replace(/\/$/, '');
  return { url, enabled: sameOrigin || Boolean(url) };
}
