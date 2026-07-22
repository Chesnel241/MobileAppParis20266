import { useEffect, useState } from 'react';
import {
  detectSituation,
  watchInstallPrompt,
  onInstallPromptChange,
  hasNativePrompt,
  triggerNativeInstall,
} from '../data/install';
import { EVENT_SITE_HOST } from '../data/constants';

// Guide d'installation bloquant : tant que l'application n'est pas ajoutée à
// l'écran d'accueil, le participant ne peut pas entrer. C'est la seule façon
// d'avoir les notifications sur iPhone (Apple ne les autorise qu'aux apps
// installées), et cela garantit qu'il ne ratera pas les annonces de dernière minute.

const NAVY = '#0E1B38';
const YELLOW = '#F2E94E';
const RED = '#EA4630';

// Flèche animée qui pointe vers le bouton réel du navigateur.
function Pointer({ direction = 'down' }) {
  const rotate = direction === 'down' ? 0 : 180;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      animation: 'p26-bounce 1.4s ease-in-out infinite',
      transform: `rotate(${rotate}deg)`,
    }}>
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={YELLOW} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v16" />
        <path d="M5 13l7 7 7-7" />
      </svg>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div style={{
        flex: 'none',
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        background: YELLOW,
        color: NAVY,
        fontWeight: 800,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>{n}</div>
      <div style={{ fontSize: '14.5px', lineHeight: 1.5, color: 'rgba(255,255,255,0.92)' }}>{children}</div>
    </div>
  );
}

// Icône « Partager » d'iOS, pour que le participant reconnaisse le bon bouton.
function IOSShareIcon() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '26px',
      height: '26px',
      borderRadius: '7px',
      background: 'rgba(255,255,255,0.16)',
      verticalAlign: 'middle',
      margin: '0 3px',
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 15V3" />
        <path d="M8 7l4-4 4 4" />
        <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      </svg>
    </span>
  );
}

export default function InstallGuide({ lang = 'fr', onSkip }) {
  const [situation, setSituation] = useState(detectSituation);
  const [promptReady, setPromptReady] = useState(hasNativePrompt);
  const [busy, setBusy] = useState(false);
  const [waited, setWaited] = useState(false);

  const fr = lang === 'fr';

  useEffect(() => {
    const stopWatch = watchInstallPrompt();
    const stopListen = onInstallPromptChange((ready, installed) => {
      setPromptReady(ready);
      if (installed) setSituation('installed');
    });
    return () => { stopWatch(); stopListen(); };
  }, []);

  // Si l'utilisateur installe puis revient, on le détecte sans rechargement.
  useEffect(() => {
    const recheck = () => setSituation(detectSituation());
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener?.('change', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      mq.removeEventListener?.('change', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, []);

  // Filet de sécurité : au bout de 25 s, une sortie discrète apparaît, pour ne
  // jamais enfermer un participant dont l'appareil ne saurait pas installer.
  useEffect(() => {
    const id = setTimeout(() => setWaited(true), 25000);
    return () => clearTimeout(id);
  }, []);

  const install = async () => {
    setBusy(true);
    const accepted = await triggerNativeInstall();
    setBusy(false);
    if (accepted) setSituation('installed');
  };

  const title = fr ? "Installez l'application" : 'Install the app';
  const why = fr
    ? "Ajoutez-la à votre écran d'accueil pour recevoir les notifications de l'organisation (changements de salle, annonces) et y accéder en un geste."
    : 'Add it to your Home Screen to receive the organisation’s notifications (room changes, announcements) and open it in one tap.';

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${NAVY} 0%, #16305A 55%, #1d6b53 140%)`,
      color: '#fff',
      fontFamily: "'Poppins', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      padding: 'calc(28px + env(safe-area-inset-top)) 22px calc(24px + env(safe-area-inset-bottom))',
      maxWidth: '520px',
      margin: '0 auto',
    }}>
      <style>{`
        @keyframes p26-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
      `}</style>

      {/* Marque */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '9px',
          background: '#fff',
          borderRadius: '100px',
          padding: '7px 15px 7px 8px',
        }}>
          <img src={`${import.meta.env.BASE_URL}uploads/logo_lwmfd.png`} alt="" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
          <span style={{ width: '1px', height: '20px', background: 'rgba(18,23,42,0.15)' }} />
          <img src={`${import.meta.env.BASE_URL}uploads/img7-removebg-preview.png`} alt="Convention Paris 2026" style={{ height: '22px', objectFit: 'contain' }} />
        </div>
      </div>

      <h1 style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: '27px',
        textTransform: 'uppercase',
        textAlign: 'center',
        margin: '0 0 10px',
        lineHeight: 1.15,
      }}>{title}</h1>

      <p style={{
        textAlign: 'center',
        fontSize: '14px',
        lineHeight: 1.55,
        color: 'rgba(255,255,255,0.8)',
        margin: '0 0 26px',
      }}>{why}</p>

      <div style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: '20px',
        padding: '20px 18px',
        flex: 1,
      }}>
        {/* ---------- iPhone / iPad dans Safari ---------- */}
        {situation === 'ios-safari' && (
          <>
            <Step n="1">
              {fr ? <>Touchez le bouton <strong>Partager</strong> <IOSShareIcon /> en bas de votre écran.</>
                  : <>Tap the <strong>Share</strong> button <IOSShareIcon /> at the bottom of your screen.</>}
            </Step>
            <Step n="2">
              {fr ? <>Faites défiler et choisissez <strong>« Sur l'écran d'accueil »</strong>.</>
                  : <>Scroll down and choose <strong>“Add to Home Screen”</strong>.</>}
            </Step>
            <Step n="3">
              {fr ? <>Touchez <strong>Ajouter</strong>, puis ouvrez l'application depuis sa nouvelle icône.</>
                  : <>Tap <strong>Add</strong>, then open the app from its new icon.</>}
            </Step>
            <div style={{ marginTop: '22px' }}>
              <div style={{
                textAlign: 'center',
                fontSize: '12.5px',
                color: YELLOW,
                fontWeight: 700,
                marginBottom: '4px',
              }}>{fr ? 'Le bouton Partager est ici' : 'The Share button is here'}</div>
              <Pointer direction="down" />
            </div>
          </>
        )}

        {/* ---------- iPhone hors Safari (WhatsApp, Chrome iOS…) ---------- */}
        {situation === 'ios-other' && (
          <>
            <div style={{
              background: 'rgba(234,70,48,0.18)',
              border: '1px solid rgba(234,70,48,0.4)',
              borderRadius: '14px',
              padding: '13px 15px',
              marginBottom: '18px',
              fontSize: '13.5px',
              lineHeight: 1.5,
            }}>
              {fr
                ? "Vous avez ouvert ce lien depuis une autre application. Sur iPhone, seul Safari peut installer l'application."
                : 'You opened this link from another app. On iPhone, only Safari can install the app.'}
            </div>
            <Step n="1">
              {fr ? <>Touchez <strong>⋯</strong> ou <strong>Partager</strong>, puis <strong>« Ouvrir dans Safari »</strong>.</>
                  : <>Tap <strong>⋯</strong> or <strong>Share</strong>, then <strong>“Open in Safari”</strong>.</>}
            </Step>
            <Step n="2">
              {fr ? <>Dans Safari, suivez le guide pour ajouter à l'écran d'accueil.</>
                  : <>In Safari, follow the guide to add it to your Home Screen.</>}
            </Step>
            <div style={{ fontSize: '13px', lineHeight: 1.55, marginTop: '14px', opacity: 0.85 }}>
              {fr
                ? <>Si vous ne trouvez pas cette option, ouvrez <strong>{EVENT_SITE_HOST}</strong> dans Safari : le lien vers l'application s'y trouve.</>
                : <>If you can’t find that option, open <strong>{EVENT_SITE_HOST}</strong> in Safari: the link to the app is there.</>}
            </div>
          </>
        )}

        {/* ---------- Android ---------- */}
        {(situation === 'android' || situation === 'android-inapp') && (
          <>
            {promptReady ? (
              <>
                <Step n="1">
                  {fr ? <>Touchez le bouton ci-dessous, puis confirmez <strong>Installer</strong>.</>
                      : <>Tap the button below, then confirm <strong>Install</strong>.</>}
                </Step>
                <button
                  type="button"
                  onClick={install}
                  disabled={busy}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    background: RED,
                    color: '#fff',
                    border: 0,
                    borderRadius: '100px',
                    padding: '15px',
                    fontWeight: 800,
                    fontSize: '15px',
                    cursor: busy ? 'wait' : 'pointer',
                  }}
                >{busy ? '…' : (fr ? "📲 Installer l'application" : '📲 Install the app')}</button>
              </>
            ) : (
              <>
                <Step n="1">
                  {fr ? <>Ouvrez le menu <strong>⋮</strong> en haut à droite de Chrome.</>
                      : <>Open the <strong>⋮</strong> menu at the top right of Chrome.</>}
                </Step>
                <Step n="2">
                  {fr ? <>Choisissez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</>
                      : <>Choose <strong>“Install app”</strong> or <strong>“Add to Home screen”</strong>.</>}
                </Step>
                <div style={{ marginTop: '20px' }}>
                  <div style={{ textAlign: 'center', fontSize: '12.5px', color: YELLOW, fontWeight: 700, marginBottom: '6px' }}>
                    {fr ? 'Le menu est en haut à droite' : 'The menu is at the top right'}
                  </div>
                  <Pointer direction="up" />
                </div>
              </>
            )}
          </>
        )}

        {/* ---------- Ordinateur ---------- */}
        {situation === 'desktop' && (
          <>
            <div style={{ fontSize: '14px', lineHeight: 1.55, marginBottom: '16px' }}>
              {fr
                ? <>L'application est conçue pour votre téléphone. Depuis votre mobile, ouvrez le site de la convention et touchez le lien vers l'application :</>
                : <>The app is made for your phone. From your mobile, open the convention website and tap the link to the app:</>}
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '15px',
              fontWeight: 700,
              wordBreak: 'break-all',
              textAlign: 'center',
              marginBottom: '14px',
            }}>{EVENT_SITE_HOST}</div>
            <button
              type="button"
              onClick={onSkip}
              style={{
                width: '100%',
                marginTop: '10px',
                background: 'transparent',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '100px',
                padding: '12px',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >{fr ? 'Continuer sur cet ordinateur' : 'Continue on this computer'}</button>
          </>
        )}
      </div>

      {/* Sortie de secours, volontairement discrète et différée : elle évite
          d'enfermer définitivement un participant dont l'appareil ne sait pas
          installer, sans détourner les autres du parcours recommandé. */}
      {waited && situation !== 'desktop' && (
        <button
          type="button"
          onClick={onSkip}
          style={{
            marginTop: '18px',
            background: 'none',
            border: 0,
            color: 'rgba(255,255,255,0.45)',
            fontSize: '12.5px',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          {fr
            ? "Je n'y arrive pas — continuer sans installer (sans notifications)"
            : 'I can’t install — continue without it (no notifications)'}
        </button>
      )}
    </div>
  );
}
