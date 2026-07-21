/* Service worker de la Convention Paris 2026.
 *
 * Volontairement limité aux notifications push : AUCUN cache hors-ligne.
 * Pendant l'événement, le contenu (programme, salles, logements) peut changer
 * d'une minute à l'autre ; un cache risquerait d'afficher une information
 * périmée, ce qui serait pire que pas d'information du tout.
 */

self.addEventListener('install', () => {
  // Prend la main immédiatement, sans attendre la fermeture des onglets.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
