import { test } from 'node:test';
import assert from 'node:assert/strict';

// Le 22 juillet 2026, veille de l'événement, l'application refusait de démarrer
// et affichait « Les informations vérifiées sont momentanément indisponibles. »
// La cause n'était pas une panne : le programme des journées 4 à 8 n'était pas
// encore saisi et les enseignements n'avaient pas de fichier. Priver tout le
// monde du programme du jour pour une journée lointaine non renseignée est un
// mauvais arbitrage — la validation stricte reste réservée à la mise en ligne.
const { prepareContent, assertValidContent } = await import('../src/data/contentValidation.js');
const { defaultContent } = await import('../src/data/defaultContent.js');

// Contenu structurellement sain, mais incomplet comme en conditions réelles.
const incomplet = () => {
  const c = structuredClone(defaultContent);
  c.sessions = c.sessions.filter(s => s.dayId === 'd1');
  c.audios = [{ id: 'a1', titleFr: 'Session 1', titleEn: 'Session 1', duration: '45 min', url: '' }];
  return c;
};

test('un programme incomplet n’empêche plus l’application de démarrer', () => {
  const ready = prepareContent(incomplet());
  assert.ok(ready.days.length > 1);
  assert.equal(ready.sessions.every(s => s.dayId === 'd1'), true);
});

test('les enseignements sans fichier sont masqués, pas bloquants', () => {
  assert.equal(prepareContent(incomplet()).audios.length, 0);
});

test('un enseignement pourvu d’un fichier reste affiché', () => {
  const c = incomplet();
  c.audios[0].url = '/media/session-1.mp3';
  assert.equal(prepareContent(c).audios.length, 1);
  c.audios[0].url = 'https://exemple.fr/session-1.mp3';
  assert.equal(prepareContent(c).audios.length, 1);
});

test('un enseignement incomplet est écarté même avec un fichier', () => {
  const c = incomplet();
  c.audios[0] = { id: 'a1', titleFr: '', titleEn: 'Session', duration: '45 min', url: '/media/a.mp3' };
  assert.equal(prepareContent(c).audios.length, 0);
});

// La tolérance porte sur ce qui manque, jamais sur ce qui est cassé.
test('un contenu réellement cassé reste refusé', () => {
  const c = incomplet();
  delete c.sejour;
  assert.throws(() => prepareContent(c), /sejour/);
  assert.throws(() => prepareContent(null), /objet attendu/);
  assert.throws(() => prepareContent([]), /objet attendu/);
});

test('une date de compte à rebours invalide reste refusée', () => {
  const c = incomplet();
  c.countdownTargetISO = 'demain';
  assert.throws(() => prepareContent(c), /countdownTargetISO/);
});

test('le contrôle de mise en ligne, lui, reste strict', () => {
  assert.throws(
    () => assertValidContent(incomplet(), { requireCompleteSchedule: true }),
    /aucune session pour d2/
  );
});
