import { test } from 'node:test';
import assert from 'node:assert/strict';

// Régression : le 22 juillet 2026, l'application déployée tournait en mode démo
// parce que VITE_API_URL était absente du build Vercel. L'écran d'accueil
// s'affichait normalement, mais aucune inscription n'atteignait le serveur.
const { resolveApiTarget } = await import('../src/data/apiTarget.js');

const web = { protocol: 'https:', hostname: 'paris-2026-app.vercel.app' };
const natif = { protocol: 'capacitor:', hostname: 'localhost' };
const local = { protocol: 'http:', hostname: 'localhost' };

test('sans variable, une page publiée parle à son propre domaine', () => {
  const t = resolveApiTarget(undefined, web);
  assert.equal(t.enabled, true);
  assert.equal(t.url, '');
});

test('« same-origin » donne des appels relatifs', () => {
  assert.deepEqual(resolveApiTarget('same-origin', web), { url: '', enabled: true });
  assert.deepEqual(resolveApiTarget('/', web), { url: '', enabled: true });
});

test('une URL absolue est conservée sans barre oblique finale', () => {
  const t = resolveApiTarget('https://api.exemple.fr/', web);
  assert.equal(t.url, 'https://api.exemple.fr');
  assert.equal(t.enabled, true);
});

test('une application native reste hors-ligne tant qu’aucune URL n’est fournie', () => {
  assert.equal(resolveApiTarget('', natif).enabled, false);
  assert.equal(resolveApiTarget('https://api.exemple.fr', natif).enabled, true);
});

test('le développement local reste hors-ligne par défaut', () => {
  assert.equal(resolveApiTarget('', local).enabled, false);
});

test('sans contexte navigateur, le mode hors-ligne s’applique', () => {
  assert.equal(resolveApiTarget('', null).enabled, false);
});
