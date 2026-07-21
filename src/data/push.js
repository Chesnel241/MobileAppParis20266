// Notifications push web côté application.
//
// Contrainte majeure iOS : Safari n'autorise le push QUE si l'application a été
// ajoutée à l'écran d'accueil (iOS 16.4+). Dans un onglet Safari classique,
// l'abonnement est impossible — on le détecte pour afficher le bon message.

import { API_URL, API_ENABLED, getParticipantToken } from './api';

const SW_URL = '/sw.js';

export const pushSupported = () =>
  typeof window !== 'undefined'
  && 'serviceWorker' in navigator
  && 'PushManager' in window
  && 'Notification' in window;

/** L'app tourne-t-elle en mode installé (écran d'accueil) ? */
export const isInstalled = () =>
  typeof window !== 'undefined'
  && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

export const isIOS = () =>
  typeof navigator !== 'undefined'
  && (/iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/**
 * Raison pour laquelle le push est indisponible, ou null si tout est possible.
 * Sert à afficher un message utile plutôt qu'un bouton qui ne marchera pas.
 */
export function pushBlockedReason() {
  if (!API_ENABLED) return 'offline';
  if (!pushSupported()) return isIOS() && !isInstalled() ? 'ios_needs_install' : 'unsupported';
  if (isIOS() && !isInstalled()) return 'ios_needs_install';
  if (Notification.permission === 'denied') return 'denied';
  return null;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SW_URL);
  } catch {
    return null;
  }
}

// La clé VAPID est transmise en base64url ; l'API Push attend un Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function fetchPublicKey() {
  const res = await fetch(`${API_URL}/api/push/public-key`);
  if (!res.ok) return null;
  const { publicKey } = await res.json();
  return publicKey || null;
}

/** Abonnement existant, s'il y en a un. */
export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

/**
 * Demande la permission et abonne l'appareil.
 * DOIT être appelée depuis un geste utilisateur (clic), sinon iOS refuse.
 * Renvoie { ok: true } ou { ok: false, reason }.
 */
export async function enablePush(lang = 'fr') {
  const blocked = pushBlockedReason();
  if (blocked) return { ok: false, reason: blocked };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const reg = (await navigator.serviceWorker.getRegistration()) || (await registerServiceWorker());
  if (!reg) return { ok: false, reason: 'no_service_worker' };
  await navigator.serviceWorker.ready;

  const publicKey = await fetchPublicKey();
  if (!publicKey) return { ok: false, reason: 'not_configured' };

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const res = await fetch(`${API_URL}/api/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getParticipantToken()}`,
    },
    body: JSON.stringify({ subscription: subscription.toJSON(), lang }),
  });
  if (!res.ok) return { ok: false, reason: 'server_error' };
  return { ok: true };
}

export async function disablePush() {
  const subscription = await currentSubscription();
  if (!subscription) return;
  const { endpoint } = subscription.toJSON();
  try {
    await fetch(`${API_URL}/api/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getParticipantToken()}`,
      },
      body: JSON.stringify({ endpoint }),
    });
  } catch { /* le serveur nettoiera l'abonnement périmé de lui-même */ }
  await subscription.unsubscribe();
}
