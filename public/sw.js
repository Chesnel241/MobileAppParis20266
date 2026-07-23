/* Service worker de la Convention Paris 2026.
 *
 * Deux exigences opposées à concilier :
 *
 * 1. Ne JAMAIS servir un contenu périmé. Pendant l'événement, le programme, les
 *    salles et les logements changent d'une minute à l'autre : une information
 *    ancienne serait pire que pas d'information.
 *
 * 2. Être réellement installable sur Android. Chrome n'accorde une véritable
 *    installation (WebAPK, avec l'icône et le nom de l'application) que si le
 *    service worker possède un gestionnaire « fetch » capable de répondre hors
 *    ligne. Sans lui, Chrome se rabat sur un simple raccourci et affiche un
 *    avertissement de provenance inconnue, très dissuasif pour les participants.
 *
 * D'où la stratégie : le réseau d'abord, toujours. Seule l'ossature de la page
 * est conservée, et uniquement comme secours en cas de coupure. Les appels à
 * l'API ne sont jamais mis en cache.
 */

const SHELL_CACHE = 'p26-shell-v1';
const SHELL_URL = '/index.html';

self.addEventListener('install', (event) => {
  // Prend la main immédiatement, sans attendre la fermeture des onglets.
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.add(new Request(SHELL_URL, { cache: 'reload' })))
      .catch(() => { /* hors ligne au moment de l'installation : sans gravité */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms.filter(n => n !== SHELL_CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // L'API reste hors de toute mise en cache : c'est la source de vérité.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Seules les navigations sont interceptées. Les fichiers versionnés (JS, CSS,
  // images) portent déjà une empreinte dans leur nom : le cache HTTP suffit.
  if (request.mode !== 'navigate') return;

  event.respondWith((async () => {
    try {
      const reseau = await fetch(request);
      // Ossature rafraîchie à chaque visite réussie : le secours ne vieillit pas.
      const cache = await caches.open(SHELL_CACHE);
      cache.put(SHELL_URL, reseau.clone()).catch(() => {});
      return reseau;
    } catch {
      const secours = await caches.match(SHELL_URL);
      if (secours) return secours;
      throw new Error('hors ligne');
    }
  })());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Convention Paris 2026';
  const options = {
    body: data.body || '',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    // Regroupe les notifications successives plutôt que d'empiler
    tag: 'convention-paris-2026',
    renotify: true,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Si l'app est déjà ouverte, on la met au premier plan plutôt que d'ouvrir un doublon.
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});
