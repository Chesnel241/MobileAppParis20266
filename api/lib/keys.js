// Contrôles sur les clés Supabase, isolés pour être partagés et testés.
//
// Deux clés circulent, avec des rôles opposés, et les confondre est silencieux :
//   - la clé « anon » est transmise au navigateur : si une clé secrète s'y
//     retrouve, toute la base est exposée (contournement de RLS) ;
//   - la clé « service_role » est utilisée par les fonctions serveur : si une
//     clé publique s'y retrouve, RLS s'applique et l'application semble marcher
//     en lecture (zéro ligne, on affiche les valeurs par défaut) mais toute
//     écriture échoue. C'est arrivé en production le 22 juillet 2026.
//
// Dans les deux cas, mieux vaut refuser de démarrer.

function fail(message) {
  throw new Error(`[CONFIG] ${message}`);
}

// Rôle inscrit dans la charge utile d'un jeton Supabase (ancien format JWT).
// Renvoie null si la clé n'est pas un JWT lisible.
function jwtRole(key) {
  if (!key.startsWith('eyJ')) return null;
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString('utf8'));
    return payload.role || null;
  } catch {
    return null;
  }
}

export function assertPublishableKey(key) {
  if (key.startsWith('sb_secret_')) {
    fail('SUPABASE_ANON_KEY contient une clé SECRÈTE (sb_secret_…). '
      + 'Utilisez la clé publiable (sb_publishable_… ou la clé « anon public »). '
      + 'Révoquez immédiatement la clé secrète exposée dans Supabase.');
  }
  const role = jwtRole(key);
  if (role && role !== 'anon') {
    fail(`SUPABASE_ANON_KEY porte le rôle « ${role} » au lieu de « anon ». `
      + 'Cette clé ne doit jamais être exposée au navigateur.');
  }
  return key;
}

export function assertServiceKey(key) {
  if (key.startsWith('sb_publishable_')) {
    fail('SUPABASE_SERVICE_ROLE_KEY contient une clé PUBLIABLE (sb_publishable_…). '
      + 'Utilisez la clé « service_role » (Settings ▸ API ▸ service_role), '
      + 'sinon RLS bloque toutes les écritures : aucune inscription ne serait enregistrée.');
  }
  const role = jwtRole(key);
  if (role && role !== 'service_role') {
    fail(`SUPABASE_SERVICE_ROLE_KEY porte le rôle « ${role} » au lieu de « service_role ». `
      + 'RLS bloquerait toutes les écritures : aucune inscription ne serait enregistrée.');
  }
  return key;
}
