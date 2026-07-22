// Normalisation des identités, partagée par l'accès aux données et par le pont
// vers les inscriptions du site. Isolée dans son propre module pour qu'aucun
// cycle d'import ne s'installe entre repo.js et siteRegistry.js.

// Les numéros sont saisis de mille façons (« +33 6 12 … », « 0612… », indicatif
// séparé) : seuls les 9 derniers chiffres sont comparables de façon fiable.
export const normPhone = (p) => String(p || '').replace(/\D/g, '').slice(-9);

// Minuscules, accents retirés, espaces normalisés : « Éloïse  MBEMBA » et
// « eloise mbemba » désignent la même personne.
export const normName = (s) => String(s || '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+/g, ' ').trim();
