// Client Supabase côté serveur (fonctions Vercel), avec la clé service_role.
// Cette clé contourne les politiques RLS : elle ne doit JAMAIS être exposée au
// navigateur. Elle vit uniquement dans les variables d'environnement Vercel.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Échec explicite au démarrage plutôt qu'une erreur obscure à la première requête.
  throw new Error('[CONFIG] SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont obligatoires.');
}

export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'media';

export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// URL publique d'un fichier du bucket média.
export function publicMediaUrl(path) {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
