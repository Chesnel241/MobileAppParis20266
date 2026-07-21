// Initialisation des fonctionnalités natives (iOS/Android via Capacitor).
// Sur le web, tout est ignoré (no-op) : ces appels ne s'exécutent qu'en app native.
import { Capacitor } from '@capacitor/core';

function notificationId(sessionId) {
  let hash = 0;
  for (const char of String(sessionId)) hash = ((hash * 31) + char.charCodeAt(0)) | 0;
  return Math.abs(hash || 1);
}

export async function initNative() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });       // icônes claires sur l'en-tête navy
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#0E1B38' });
    }
  } catch { /* plugin indisponible : on ignore */ }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch { /* plugin indisponible : on ignore */ }
}

export async function scheduleSessionReminder(session, lang = 'fr') {
  if (!Capacitor.isNativePlatform()) return false;
  const startsAt = new Date(session.startISO);
  if (!Number.isFinite(startsAt.getTime()) || startsAt <= new Date()) return false;

  // Quinze minutes avant, ou quelques secondes plus tard si la session est imminente.
  const desired = new Date(startsAt.getTime() - 15 * 60 * 1000);
  const at = desired > new Date() ? desired : new Date(Date.now() + 3000);
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') return false;
    const title = lang === 'fr' ? 'Convention Paris 2026' : 'Paris 2026 Convention';
    const sessionTitle = lang === 'fr' ? session.tFr : (session.tEn || session.tFr);
    const body = lang === 'fr'
      ? `${sessionTitle} commence dans 15 minutes.`
      : `${sessionTitle} starts in 15 minutes.`;
    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId(session.id),
        title,
        body,
        schedule: { at, allowWhileIdle: true },
        extra: { sessionId: session.id },
      }],
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelSessionReminder(sessionId) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: notificationId(sessionId) }] });
  } catch { /* plugin ou permission indisponible */ }
}
