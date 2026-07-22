import { test } from 'node:test';
import assert from 'node:assert/strict';

// Rapprochement entre un participant de l'application et son inscription sur le
// site de l'événement. Un faux positif afficherait à quelqu'un l'adresse d'un
// autre : on n'accepte que les correspondances uniques.
const { matchRegistration, housingFromRegistration } = await import('../api/lib/siteRegistry.js');

const inscription = (over = {}) => ({
  id: 'r1', full_name: 'Jean Dupont', phone_code: '+33', phone: '612345678',
  housing_address: '12 rue de Paris, Charenton', room_number: '204',
  housing_notes: 'Arrivée après 18 h', start_date: '2026-07-24', end_date: '2026-07-31',
  ...over,
});

const participant = (over = {}) => ({ first_name: 'Jean', last_name: 'Dupont', phone: '+33 6 12 34 56 78', ...over });

test('le téléphone rapproche malgré des formats d’écriture différents', () => {
  const r = inscription();
  assert.equal(matchRegistration(participant({ phone: '06 12 34 56 78' }), [r]), r);
});

test('le nom rapproche quel que soit l’ordre et les accents', () => {
  const r = inscription({ full_name: 'ÉLOÏSE  MBEMBA', phone: '', phone_code: '' });
  const p = participant({ first_name: 'Mbemba', last_name: 'Eloise', phone: '' });
  assert.equal(matchRegistration(p, [r]), r);
});

test('deux inscriptions au même numéro : on départage par le nom', () => {
  const mere = inscription({ id: 'r1', full_name: 'Awa Traore' });
  const fils = inscription({ id: 'r2', full_name: 'Ibrahim Traore' });
  const found = matchRegistration(participant({ first_name: 'Ibrahim', last_name: 'Traore' }), [mere, fils]);
  assert.equal(found.id, 'r2');
});

test('deux homonymes sans téléphone : aucun rapprochement', () => {
  const a = inscription({ id: 'r1', phone: '', phone_code: '' });
  const b = inscription({ id: 'r2', phone: '', phone_code: '' });
  assert.equal(matchRegistration(participant({ phone: '' }), [a, b]), null);
});

test('personne d’inconnu n’est rapproché', () => {
  assert.equal(matchRegistration(participant({ first_name: 'Zoe', last_name: 'Inconnue', phone: '+33 700000000' }), [inscription()]), null);
});

test('liste vide ou participant absent : null, sans exception', () => {
  assert.equal(matchRegistration(participant(), []), null);
  assert.equal(matchRegistration(null, [inscription()]), null);
});

test('un hébergement sans adresse ni chambre n’est pas affiché', () => {
  assert.equal(housingFromRegistration(inscription({ housing_address: '', room_number: '' })), null);
  assert.equal(housingFromRegistration(null), null);
});

test('l’hébergement du site est repris avec sa chambre et ses dates', () => {
  const h = housingFromRegistration(inscription());
  assert.equal(h.source, 'site');
  assert.equal(h.address, '12 rue de Paris, Charenton');
  assert.equal(h.room, '204');
  assert.equal(h.startDate, '2026-07-24');
});

test('une chambre seule suffit à afficher l’hébergement', () => {
  const h = housingFromRegistration(inscription({ housing_address: '' }));
  assert.equal(h.room, '204');
  assert.equal(h.address, '');
});
