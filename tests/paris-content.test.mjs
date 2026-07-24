import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';

// « Découvrir Paris » : le guide de l'organisation, intégré sous forme de
// catégories (sites à proximité, familles, monuments, souvenirs), chaque site
// portant description, adresse, transport, tarif et photo.
const { defaultContent } = await import('../src/data/defaultContent.js');
const { defaultContent: apiDefaults } = await import('../api/lib/defaults.js');
const { prepareContent, validateContent } = await import('../src/data/contentValidation.js');

test('les deux fichiers de contenu par défaut restent identiques', () => {
  assert.equal(JSON.stringify(defaultContent.paris), JSON.stringify(apiDefaults.paris));
});

test('la section Paris est structurée en catégories peuplées', () => {
  const cats = defaultContent.paris.categories;
  assert.ok(Array.isArray(cats) && cats.length >= 4, 'au moins quatre catégories');
  for (const c of cats) {
    assert.ok(c.titleFr && c.titleEn, `titres manquants pour ${c.id}`);
    assert.ok(Array.isArray(c.sites) && c.sites.length >= 1, `aucun site dans ${c.id}`);
  }
});

test('chaque site nommé a une recherche cartographique', () => {
  for (const c of defaultContent.paris.categories) {
    for (const s of c.sites) {
      assert.ok(s.nameFr && s.nameEn, 'nom bilingue requis');
      assert.ok(s.mapQuery, `mapQuery manquant pour ${s.id}`);
    }
  }
});

test('les photos référencées existent réellement dans public/paris', () => {
  const fichiers = new Set(readdirSync(new URL('../public/paris', import.meta.url)));
  for (const c of defaultContent.paris.categories) {
    for (const s of c.sites) {
      if (!s.photo) continue;
      assert.ok(s.photo.startsWith('/paris/'), `chemin inattendu : ${s.photo}`);
      const nom = s.photo.split('/').pop();
      assert.ok(fichiers.has(nom), `photo absente du dépôt : ${nom}`);
    }
  }
});

test('un fichier de crédits accompagne les photos', () => {
  const fichiers = new Set(readdirSync(new URL('../public/paris', import.meta.url)));
  assert.ok(fichiers.has('credits.json'), 'crédits Wikimedia requis (licences CC)');
});

test('le contenu par défaut passe la validation (hors audios sans fichier)', () => {
  const r = validateContent(defaultContent, { requireCompleteSchedule: false });
  const horsAudios = r.errors.filter(e => !e.startsWith('audios'));
  assert.deepEqual(horsAudios, [], 'erreurs inattendues : ' + horsAudios.join(' | '));
});

test('une photo au chemin invalide est refusée', () => {
  const c = structuredClone(defaultContent);
  c.paris.categories[0].sites[0].photo = 'ftp://exemple/x.jpg';
  const r = validateContent(c, { requireCompleteSchedule: false });
  assert.ok(r.errors.some(e => e.includes('.photo')), 'la photo invalide doit être signalée');
});

// Compatibilité ascendante : tant que la base n'est pas mise à jour, elle renvoie
// l'ancien format « landmarks ». L'application doit continuer de fonctionner.
test('l’ancien format landmarks est normalisé en catégories', () => {
  const legacy = structuredClone(defaultContent);
  legacy.paris = {
    transport: defaultContent.paris.transport,
    landmarks: [
      { id: 'l1', nameFr: 'Tour Eiffel', nameEn: 'Eiffel Tower', descFr: 'a', descEn: 'a', mapQuery: 'Tour+Eiffel' },
      { id: 'l2', nameFr: 'Louvre', nameEn: 'Louvre', descFr: 'b', descEn: 'b', mapQuery: 'Louvre' },
    ],
  };
  const prepared = prepareContent(legacy);
  assert.equal(prepared.paris.categories.length, 1);
  assert.equal(prepared.paris.categories[0].sites.length, 2);
  assert.equal(prepared.paris.categories[0].sites[0].nameFr, 'Tour Eiffel');
});
