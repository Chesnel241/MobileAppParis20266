// Envoi des notifications push (Web Push / VAPID) depuis les fonctions Vercel.
// Les abonnements sont lus/écrits via le repo Supabase.
import webpush from 'web-push';
import { allSubscriptions, removeSubscription, markSubscriptionError } from './repo.js';

let configured = false;

export function initPush(vapid) {
  if (!vapid) return false;
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  configured = true;
  return true;
}

export const isPushConfigured = () => configured;

/**
 * Diffuse une notification à tous les abonnés, dans leur langue.
 * Ne lève jamais : un échec d'envoi ne doit pas invalider la notification.
 */
export async function broadcast({ fr, en, titleFr = '', titleEn = '', url = '/' }) {
  if (!configured) return { sent: 0, removed: 0 };
  const rows = await allSubscriptions();
  let sent = 0, removed = 0;

  await Promise.all(rows.map(async (row) => {
    const body = row.lang === 'en' ? (en || fr) : fr;
    // Le titre de l'annonce, s'il est fourni, coiffe la notification système ;
    // sinon on retombe sur le nom de la convention.
    const defaultTitle = row.lang === 'en' ? 'Paris 2026 Convention' : 'Convention Paris 2026';
    const title = (row.lang === 'en' ? (titleEn || titleFr) : (titleFr || titleEn)) || defaultTitle;
    const payload = JSON.stringify({ title, body, url });
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload, { TTL: 12 * 3600 }
      );
      sent++;
    } catch (error) {
      const status = error?.statusCode;
      if (status === 404 || status === 410) {
        await removeSubscription(row.endpoint);
        removed++;
      } else {
        await markSubscriptionError(row.endpoint, String(error?.message || status || 'erreur'));
      }
    }
  }));

  return { sent, removed };
}
