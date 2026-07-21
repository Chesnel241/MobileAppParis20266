// Notifications push web (standard Web Push / VAPID).
//
// Fonctionne sur Android (Chrome, Firefox…) et sur iPhone à partir d'iOS 16.4,
// À CONDITION que l'application ait été ajoutée à l'écran d'accueil : dans un
// simple onglet Safari, iOS n'autorise pas le push.
//
// Les abonnements périmés (404/410) sont supprimés automatiquement.
import webpush from 'web-push';
import db from './db.js';

let configured = false;

export function initPush(vapid) {
  if (!vapid) return false;
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  configured = true;
  return true;
}

export const isPushConfigured = () => configured;

export function saveSubscription({ endpoint, keys }, { participantId = null, lang = 'fr' } = {}) {
  db.prepare(`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth, participant_id, lang, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      participant_id = excluded.participant_id,
      lang = excluded.lang,
      last_error = NULL
  `).run(endpoint, keys.p256dh, keys.auth, participantId, lang, new Date().toISOString());
}

export function removeSubscription(endpoint) {
  db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
}

export const countSubscriptions = () =>
  db.prepare('SELECT COUNT(*) c FROM push_subscriptions').get().c;

/**
 * Diffuse une notification à tous les abonnés, dans leur langue.
 * Renvoie { sent, removed } — jamais d'exception : un échec d'envoi ne doit
 * pas faire échouer la création de la notification côté organisateur.
 */
export async function broadcast({ fr, en, url = '/' }) {
  if (!configured) return { sent: 0, removed: 0 };

  const rows = db.prepare('SELECT * FROM push_subscriptions').all();
  let sent = 0;
  let removed = 0;

  await Promise.all(rows.map(async (row) => {
    const body = row.lang === 'en' ? (en || fr) : fr;
    const payload = JSON.stringify({
      title: row.lang === 'en' ? 'Paris 2026 Convention' : 'Convention Paris 2026',
      body,
      url,
    });
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload,
        { TTL: 12 * 3600 }
      );
      sent++;
    } catch (error) {
      const status = error?.statusCode;
      // 404/410 : l'abonnement n'existe plus (app désinstallée, permission retirée)
      if (status === 404 || status === 410) {
        removeSubscription(row.endpoint);
        removed++;
      } else {
        db.prepare('UPDATE push_subscriptions SET last_error = ? WHERE endpoint = ?')
          .run(String(error?.message || status || 'erreur'), row.endpoint);
      }
    }
  }));

  return { sent, removed };
}
