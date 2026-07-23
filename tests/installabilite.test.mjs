import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Sur Android, Chrome n'accorde une véritable installation (WebAPK : icône, nom,
// fenêtre propre, aucun avertissement) que si trois conditions sont réunies :
// HTTPS, un manifeste complet, et un service worker doté d'un gestionnaire
// « fetch ». Il manquait le troisième : Chrome se rabattait sur un simple
// raccourci et prévenait l'utilisateur d'une provenance inconnue — de quoi
// décourager des participants venus installer l'application de leur convention.
const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));

test('le service worker intercepte les requêtes', () => {
  assert.match(sw, /addEventListener\(\s*'fetch'/, 'gestionnaire fetch absent : Chrome refusera l’installation');
});

test('une navigation hors ligne obtient une réponse de secours', () => {
  assert.match(sw, /caches\.match/, 'aucun secours hors ligne');
  assert.match(sw, /request\.mode !== 'navigate'/, 'les navigations doivent être traitées');
});

test('l’API n’est jamais mise en cache', () => {
  assert.match(sw, /pathname\.startsWith\('\/api\/'\)/, "les réponses de l'API ne doivent pas être conservées");
});

test('le réseau reste prioritaire sur le cache', () => {
  // L'ossature n'est lue que dans la branche d'échec du réseau.
  const corps = sw.slice(sw.indexOf("addEventListener('fetch'"));
  assert.ok(corps.indexOf('await fetch(request)') < corps.indexOf('caches.match'),
    'le cache ne doit servir qu’en dernier recours');
});

test('le manifeste porte tout ce que Chrome exige', () => {
  for (const clef of ['id', 'name', 'short_name', 'start_url', 'scope', 'display', 'icons']) {
    assert.ok(manifest[clef], `champ « ${clef} » manquant`);
  }
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/', 'une URL de départ absolue évite toute ambiguïté');
});

test('les icônes couvrent 192, 512 et le format masquable', () => {
  const tailles = manifest.icons.map(i => i.sizes);
  assert.ok(tailles.includes('192x192'), 'icône 192 requise');
  assert.ok(tailles.includes('512x512'), 'icône 512 requise');
  assert.ok(manifest.icons.some(i => String(i.purpose).includes('maskable')),
    'sans icône masquable, Android affiche une pastille blanche autour du logo');
});

test('les chemins des icônes sont absolus', () => {
  for (const icone of manifest.icons) {
    assert.ok(icone.src.startsWith('/'), `chemin relatif : ${icone.src}`);
  }
});
