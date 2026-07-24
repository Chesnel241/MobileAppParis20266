import { test } from 'node:test';
import assert from 'node:assert/strict';

// Annonces importantes : diffusées comme les notifications normales, mais aussi
// affichées en plein écran dans l'application, pour atteindre les participants
// qui n'ont pas activé les notifications push.
const { validateNotificationInput } = await import('../api/lib/validation.js');

test('une notification simple n’est pas importante', () => {
  const out = validateNotificationInput({ textFr: 'Bonjour' });
  assert.equal(out.important, false);
  assert.equal(out.textEn, 'Bonjour', 'l’anglais retombe sur le français');
});

test('une annonce importante conserve le drapeau et le titre', () => {
  const out = validateNotificationInput({ textFr: 'Salle B', important: true, titleFr: 'Changement de salle' });
  assert.equal(out.important, true);
  assert.equal(out.titleFr, 'Changement de salle');
  assert.equal(out.titleEn, 'Changement de salle', 'le titre EN retombe sur le titre FR');
});

test('« important » n’est vrai que pour un booléen true', () => {
  assert.equal(validateNotificationInput({ textFr: 'x', important: 'oui' }).important, false);
  assert.equal(validateNotificationInput({ textFr: 'x', important: 1 }).important, false);
});

test('un message trop long est refusé', () => {
  assert.throws(() => validateNotificationInput({ textFr: 'a'.repeat(1001) }));
});

// La logique d'affichage de l'application : on n'affiche que l'annonce importante
// la plus récente, non encore lue, et fraîche (moins de 24 h). Reproduite ici
// telle qu'implémentée dans App.jsx pour la verrouiller.
function announcementToShow(rows, acked, now = Date.now()) {
  const fresh = now - 24 * 3600 * 1000;
  return rows.find(n => n.important && !acked.includes(n.id) && new Date(n.createdAt).getTime() >= fresh) || null;
}

const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();

test('l’annonce importante fraîche et non lue est retenue', () => {
  const rows = [
    { id: 'n2', important: true, createdAt: iso(60 * 1000) },
    { id: 'n1', important: false, createdAt: iso(120 * 1000) },
  ];
  assert.equal(announcementToShow(rows, [])?.id, 'n2');
});

test('une annonce déjà lue ne réapparaît pas', () => {
  const rows = [{ id: 'n2', important: true, createdAt: iso(60 * 1000) }];
  assert.equal(announcementToShow(rows, ['n2']), null);
});

test('une annonce de plus de 24 h ne surgit pas chez un nouveau venu', () => {
  const rows = [{ id: 'vieux', important: true, createdAt: iso(30 * 3600 * 1000) }];
  assert.equal(announcementToShow(rows, []), null);
});

test('une notification normale ne déclenche jamais la fenêtre', () => {
  const rows = [{ id: 'n1', important: false, createdAt: iso(10 * 1000) }];
  assert.equal(announcementToShow(rows, []), null);
});
