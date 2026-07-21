// Détection de la plateforme et de l'état d'installation, pour guider le
// participant jusqu'à l'ajout sur l'écran d'accueil.
//
// Point capital : sur iPhone, SEUL Safari peut ajouter à l'écran d'accueil.
// Un lien ouvert depuis WhatsApp, Instagram ou Chrome iOS s'ouvre dans un
// navigateur intégré qui en est incapable — il faut le détecter et demander
// d'ouvrir dans Safari, sinon le participant reste bloqué sans comprendre.

const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent || '');

export const isIOS = () =>
  /iPad|iPhone|iPod/.test(ua())
  || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isAndroid = () => /Android/i.test(ua());

/** Navigateur intégré à une autre app (WhatsApp, Instagram, Facebook, LinkedIn…). */
export const isInAppBrowser = () => {
  const s = ua();
  if (/FBAN|FBAV|Instagram|Line\/|LinkedInApp|Twitter|Snapchat|Pinterest/i.test(s)) return true;
  // WhatsApp n'a pas de marqueur fiable : sur iOS il se signale comme Safari
  // sans le mot-clé « Safari » dans certaines versions.
  if (isIOS() && /AppleWebKit/.test(s) && !/Safari/.test(s) && !/CriOS|FxiOS|EdgiOS/.test(s)) return true;
  return false;
};

/** Chrome / Firefox / Edge sur iOS : ne peuvent pas installer (limitation Apple). */
export const isIOSNonSafari = () => isIOS() && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua());

/** L'application tourne-t-elle déjà installée (écran d'accueil) ? */
export const isInstalled = () => {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  return Boolean(standalone || window.navigator.standalone === true);
};

export const isMobile = () => isIOS() || isAndroid();

/**
 * Situation du visiteur, qui détermine l'écran à afficher :
 *  - 'installed'      : rien à faire, on entre dans l'app
 *  - 'ios-safari'     : guide « Partager ▸ Sur l'écran d'accueil »
 *  - 'ios-other'      : doit d'abord rouvrir le lien dans Safari
 *  - 'android'        : invite d'installation native, ou guide via le menu
 *  - 'desktop'        : proposer d'ouvrir sur téléphone (QR code)
 */
export function detectSituation() {
  // Aide au test depuis un ordinateur : ?installsim=ios-safari|ios-other|android|desktop
  if (typeof window !== 'undefined') {
    const sim = new URLSearchParams(window.location.search).get('installsim');
    if (sim) return sim;
  }
  if (isInstalled()) return 'installed';
  if (isIOS()) return (isIOSNonSafari() || isInAppBrowser()) ? 'ios-other' : 'ios-safari';
  if (isAndroid()) return isInAppBrowser() ? 'android-inapp' : 'android';
  return 'desktop';
}

/**
 * Capte l'événement d'installation d'Android/Chrome pour pouvoir déclencher
 * l'invite native au bon moment. Le navigateur ne l'émet qu'une fois.
 */
let deferredPrompt = null;
const listeners = new Set();

export function watchInstallPrompt() {
  if (typeof window === 'undefined') return () => {};
  const onPrompt = (event) => {
    event.preventDefault();
    deferredPrompt = event;
    listeners.forEach(fn => fn(true));
  };
  const onInstalled = () => {
    deferredPrompt = null;
    listeners.forEach(fn => fn(false, true));
  };
  window.addEventListener('beforeinstallprompt', onPrompt);
  window.addEventListener('appinstalled', onInstalled);
  return () => {
    window.removeEventListener('beforeinstallprompt', onPrompt);
    window.removeEventListener('appinstalled', onInstalled);
  };
}

export const onInstallPromptChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const hasNativePrompt = () => Boolean(deferredPrompt);

/** Déclenche l'invite native d'Android. Renvoie true si l'utilisateur a accepté. */
export async function triggerNativeInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  listeners.forEach(fn => fn(false));
  return outcome === 'accepted';
}

/** URL publique de l'application, pour le QR code et le partage. */
export const appUrl = () =>
  typeof window === 'undefined' ? '' : `${window.location.origin}${import.meta.env.BASE_URL || '/'}`;
