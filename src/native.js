// Initialisation des fonctionnalités natives (iOS/Android via Capacitor).
// Sur le web, tout est ignoré (no-op) : ces appels ne s'exécutent qu'en app native.
import { Capacitor } from '@capacitor/core';

export async function initNative() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });      // icônes claires sur l'en-tête navy
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#0E1B38' });
    }
  } catch { /* plugin indisponible : on ignore */ }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch { /* plugin indisponible : on ignore */ }
}
