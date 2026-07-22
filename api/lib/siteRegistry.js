// Pont vers les inscriptions du site de l'événement.
//
// Le site (dlwm-convention2026.fr) et l'application partagent le même projet
// Supabase mais pas les mêmes tables : le site tient « inscriptions » (public)
// et « internal_members » (personnes internes), l'application tient
// « participants ». Un même être humain existe donc des deux côtés, sans lien.
//
// Ce module rapproche les deux, pour que l'hébergement saisi par l'organisation
// sur le site apparaisse dans « Mon séjour » sans aucune double saisie.
//
// Règle de prudence : on ne relie que sur correspondance UNIQUE. Afficher à
// quelqu'un l'adresse d'un homonyme serait pire que de n'afficher rien.

import { normPhone, normName } from './normalize.js';

// Le site stocke un nom complet en un seul champ, l'application un prénom et un
// nom. On compare des ensembles de mots triés : « Jean Dupont » et
// « Dupont Jean » désignent la même personne.
const nameKey = (...parts) => normName(parts.filter(Boolean).join(' '))
  .split(' ').filter(Boolean).sort().join(' ');

// Le site sépare l'indicatif du numéro (« +33 » / « 612345678 »), l'application
// garde le numéro entier : on normalise des deux côtés sur les 9 derniers chiffres.
const registrationPhone = (row) => normPhone(`${row.phone_code || ''}${row.phone || ''}`);

export function matchRegistration(participant, registrations) {
  if (!participant || !Array.isArray(registrations) || registrations.length === 0) return null;

  const phone = normPhone(participant.phone);
  if (phone) {
    const byPhone = registrations.filter(r => registrationPhone(r) === phone);
    if (byPhone.length === 1) return byPhone[0];
    // Plusieurs inscriptions au même numéro (une famille, un responsable qui
    // inscrit son groupe) : le téléphone ne tranche pas, on tente le nom.
  }

  const key = nameKey(participant.first_name, participant.last_name);
  if (!key) return null;
  const byName = registrations.filter(r => nameKey(r.full_name) === key);
  return byName.length === 1 ? byName[0] : null;
}

// Un hébergement n'est exploitable que s'il a une adresse ou une chambre.
export function housingFromRegistration(row) {
  if (!row) return null;
  const address = String(row.housing_address || '').trim();
  const room = String(row.room_number || '').trim();
  if (!address && !room) return null;
  return {
    source: 'site',
    address,
    room,
    notes: String(row.housing_notes || '').trim(),
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    updatedAt: null,
  };
}
