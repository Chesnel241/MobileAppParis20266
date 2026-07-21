import { useState, useEffect, useRef } from 'react';
import './App.css';
import { ADMIN_CODE, STORAGE_PROFILE_KEY, STORAGE_ADMIN_KEY, PLACE_LABELS } from './data/constants';
import { defaultContent, upcomingSessions } from './data/defaultContent';
import { t as translate } from './data/translations';
import {
  API_ENABLED,
  registerParticipant,
  submitQuestionApi,
  fetchMyQuestions,
  adminLogin,
  fetchAdminQuestions,
  assignQuestionApi,
  fetchAdminStats,
  clearAdminToken,
  fetchContent,
  fetchNotifications,
  fetchMyHousing,
  mediaUrl,
} from './data/api';

// "il y a 2h", "hier"… à partir d'une date ISO
function relativeTime(iso, lang) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'fr' ? "À l'instant" : 'Just now';
  if (mins < 60) return lang === 'fr' ? `Il y a ${mins} min` : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'fr' ? `Il y a ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return lang === 'fr' ? 'Hier' : 'Yesterday';
  return lang === 'fr' ? `Il y a ${days} j` : `${days}d ago`;
}
import OnboardingScreen from './components/OnboardingScreen';
import AdminCodeModal from './components/AdminCodeModal';
import Header from './components/Header';
import Navigation from './components/Navigation';
import HomeTab from './components/HomeTab';
import ProgrammeTab from './components/ProgrammeTab';
import SejourTab from './components/SejourTab';
import QuestionTab from './components/QuestionTab';
import PlusTab from './components/PlusTab';
import NotificationCenter from './components/NotificationCenter';
import SessionModal from './components/SessionModal';
import MiniPlayer from './components/MiniPlayer';
import Toast from './components/Toast';

const loadProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function App() {
  // Core state
  const [currentTab, setCurrentTab] = useState('home');
  const [lang, setLang] = useState('fr');

  // Participant profile (première connexion : nom, prénom, téléphone, pays)
  const [profile, setProfile] = useState(loadProfile);

  // Contenu éditable (programme, séjour, Paris, audios, à propos, compte à rebours).
  // Repli sur defaultContent ; remplacé par le serveur si disponible.
  const [content, setContent] = useState(defaultContent);

  // Accès administrateur (organisateurs & pasteurs)
  const [adminUnlocked, setAdminUnlocked] = useState(
    () => localStorage.getItem(STORAGE_ADMIN_KEY) === '1'
  );
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState(null);

  // Notification state — vide par défaut ; alimenté par le serveur si disponible,
  // sinon quelques exemples en mode 100% local (sans backend).
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasNotifBadge, setHasNotifBadge] = useState(!API_ENABLED);
  const [notifBadgeText, setNotifBadgeText] = useState(API_ENABLED ? '' : '3');
  const [notifHistory, setNotifHistory] = useState(
    API_ENABLED ? [] : [
      { text: "Nouvelle session ajoutée au programme", time: "Il y a 2h" },
      { text: "Rappel : Prochaine session dans 30 min", time: "Il y a 5h" },
      { text: "Bienvenue à Paris 2026 !", time: "Hier" }
    ]
  );
  // Horodatage de la dernière consultation des notifications (pour le badge « non lues »)
  const [notifSeenAt, setNotifSeenAt] = useState(
    () => localStorage.getItem('p26_notif_seen') || ''
  );

  // Programme state
  const [selectedDay, setSelectedDay] = useState('d1');
  const [reminders, setReminders] = useState(new Set());
  const [openSessionId, setOpenSessionId] = useState(null);

  // Question state
  const [pastorMode, setPastorMode] = useState(false);
  const [questionDraft, setQuestionDraft] = useState('');
  const [myQuestion, setMyQuestion] = useState(null);
  const [pastorQueue, setPastorQueue] = useState(
    API_ENABLED
      ? []
      : [
          { id: "q1", text: "Comment puis-je grandir dans ma foi ?", status: "pending", participant: "Jean D." },
          { id: "q2", text: "Question sur le baptême", status: "assigned", participant: "Marie K.", pastor: "Pasteur Paul", place: "Salle A - Novotel", time: "25 juil, 14h00" }
        ]
  );

  // Statistiques organisateur (chargées depuis le serveur si disponible)
  const [adminStats, setAdminStats] = useState(null);

  // Hébergement assigné par l'organisation (null si non pris en charge)
  const [housing, setHousing] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [assignPlace, setAssignPlace] = useState('');
  const [assignTime, setAssignTime] = useState('');
  const [assignPastorName, setAssignPastorName] = useState('');

  // Paris state
  const [parisSegVenues, setParisSegVenues] = useState(false);

  // Audio state
  const [audioCurrent, setAudioCurrent] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Toast state
  const [toasts, setToasts] = useState([]);

  // Plus submenu state
  const [plusSubmenu, setPlusSubmenu] = useState(null);

  // Helper function for translations
  const t = (key) => translate(key, lang);

  // Countdown timer
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const targetDate = new Date(content.countdownTargetISO);
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate - now;
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000)
        });
      } else {
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [content.countdownTargetISO]);

  // Chargement du contenu éditable depuis le serveur (repli : defaultContent)
  useEffect(() => {
    if (!API_ENABLED) return;
    fetchContent()
      .then((c) => { if (c && typeof c === 'object') setContent(c); })
      .catch(() => { /* hors-ligne : on garde defaultContent */ });
  }, []);

  // Notifications diffusées par les organisateurs (remplacent les exemples si serveur dispo)
  useEffect(() => {
    if (!API_ENABLED) return;
    let alive = true;
    const load = () => fetchNotifications()
      .then((rows) => {
        if (!alive || !Array.isArray(rows)) return;
        setNotifHistory(rows.map(n => ({
          text: lang === 'fr' ? n.fr : (n.en || n.fr),
          time: relativeTime(n.createdAt, lang)
        })));
        const unread = rows.filter(n => !notifSeenAt || n.createdAt > notifSeenAt).length;
        setHasNotifBadge(unread > 0);
        setNotifBadgeText(unread > 9 ? '9+' : (unread ? String(unread) : ''));
      })
      .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [lang, notifSeenAt]);

  // Tab navigation functions
  const goHome = () => setCurrentTab('home');
  const goProgramme = () => setCurrentTab('programme');
  const goSejour = () => setCurrentTab('sejour');
  const goQuestion = () => setCurrentTab('question');
  const goPlus = () => setCurrentTab('plus');

  // Notification functions
  const onToggleNotif = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) {
      // Marque tout comme lu à l'ouverture
      const nowIso = new Date().toISOString();
      setNotifSeenAt(nowIso);
      try { localStorage.setItem('p26_notif_seen', nowIso); } catch { /* stockage indispo */ }
      setHasNotifBadge(false);
      setNotifBadgeText('');
    }
  };

  const onCloseNotif = () => setNotifOpen(false);

  // Toast function
  const showToast = (text) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Session modal functions
  const openSession = (sessionId) => setOpenSessionId(sessionId);
  const closeSession = () => setOpenSessionId(null);

  const toggleReminder = (sessionId) => {
    const newReminders = new Set(reminders);
    if (newReminders.has(sessionId)) {
      newReminders.delete(sessionId);
      showToast(t('toast_reminder_removed'));
    } else {
      newReminders.add(sessionId);
      showToast(t('toast_reminder_added'));
    }
    setReminders(newReminders);
  };

  // Onboarding : enregistre le profil localement + sur le serveur (si disponible)
  const completeOnboarding = async (newProfile) => {
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(newProfile));
    } catch { /* stockage indisponible : le profil reste en mémoire */ }
    setProfile(newProfile);
    if (API_ENABLED) {
      try {
        await registerParticipant(newProfile);
        // Le token existe maintenant : récupère immédiatement l'hébergement assigné
        fetchMyHousing().then(setHousing).catch(() => {});
      } catch { /* serveur indisponible : le profil reste local, synchro plus tard */ }
    }
  };

  // Accès admin : exécute l'action demandée, ou ouvre le modal de code
  const performAdminAction = (action) => {
    if (action === 'pastor') setPastorMode(true);
    if (action === 'organisateur') setPlusSubmenu('organisateur');
  };

  const requestAdminAction = (action) => {
    if (adminUnlocked) {
      performAdminAction(action);
    } else {
      setPendingAdminAction(action);
      setAdminModalOpen(true);
    }
  };

  const unlockAdmin = () => {
    setAdminUnlocked(true);
    try {
      localStorage.setItem(STORAGE_ADMIN_KEY, '1');
    } catch { /* stockage indisponible : déverrouillage en mémoire seulement */ }
    setAdminModalOpen(false);
    performAdminAction(pendingAdminAction);
    setPendingAdminAction(null);
    showToast(t('toast_admin_ok'));
  };

  // Vérifie le code admin côté serveur ; repli local si serveur indisponible.
  // onResult(true|false) est appelé de façon asynchrone.
  const handleAdminCode = (code, onResult) => {
    if (!API_ENABLED) {
      const ok = code === ADMIN_CODE;
      if (ok) unlockAdmin();
      onResult(ok);
      return;
    }
    adminLogin(code)
      .then(() => { unlockAdmin(); onResult(true); })
      .catch((err) => {
        // 401 = mauvais code ; autre erreur = serveur injoignable → repli local
        if (err.status === 401) {
          onResult(false);
        } else if (code === ADMIN_CODE) {
          unlockAdmin();
          onResult(true);
        } else {
          onResult(false);
        }
      });
  };

  const guardedSetPastorMode = (val) => {
    if (val) {
      requestAdminAction('pastor');
    } else {
      setPastorMode(false);
    }
  };

  const guardedSetPlusSubmenu = (val) => {
    if (val === 'organisateur') {
      requestAdminAction('organisateur');
    } else {
      setPlusSubmenu(val);
    }
  };

  // Question functions
  const submitQuestion = () => {
    const text = questionDraft.trim();
    if (!text) return;

    if (API_ENABLED) {
      setMyQuestion({ text, status: 'pending' });
      setQuestionDraft('');
      submitQuestionApi(text)
        .then((q) => { setMyQuestion(q); showToast('Question soumise avec succès !'); })
        .catch(() => showToast('Envoi en attente de connexion…'));
      return;
    }

    // Mode local (sans serveur)
    setMyQuestion({ text, status: 'pending' });
    const participantName = profile
      ? `${profile.firstName} ${profile.lastName.charAt(0).toUpperCase()}.`
      : 'Participant';
    setPastorQueue(prev => [
      { id: `q${Date.now()}`, text, status: 'pending', participant: participantName },
      ...prev
    ]);
    setQuestionDraft('');
    showToast('Question soumise avec succès !');
  };

  const confirmAssign = () => {
    if (!(assigningId && assignPlace && assignTime && assignPastorName)) return;
    const placeLabel = PLACE_LABELS[assignPlace]?.[lang] || assignPlace;
    const resetForm = () => {
      setAssigningId(null);
      setAssignPlace('');
      setAssignTime('');
      setAssignPastorName('');
    };

    if (API_ENABLED) {
      assignQuestionApi(assigningId, { pastorName: assignPastorName, place: placeLabel, time: assignTime })
        .then(() => { resetForm(); refreshAdminQueue(); showToast('Question assignée avec succès !'); })
        .catch(() => showToast('Échec de l’assignation. Réessayez.'));
      return;
    }

    setPastorQueue(prev => prev.map(q =>
      q.id === assigningId
        ? { ...q, status: 'assigned', pastor: assignPastorName, place: placeLabel, time: assignTime }
        : q
    ));
    resetForm();
    showToast('Question assignée avec succès !');
  };

  // Rafraîchissement de la file admin (gère l'expiration de session)
  const refreshAdminQueue = () => {
    if (!API_ENABLED) return;
    fetchAdminQuestions()
      .then((rows) => { if (Array.isArray(rows)) setPastorQueue(rows); })
      .catch((err) => {
        if (err.status === 401) { clearAdminToken(); setAdminUnlocked(false); }
      });
  };

  const refreshAdminStats = () => {
    if (!API_ENABLED) return;
    fetchAdminStats()
      .then((s) => setAdminStats(s))
      .catch(() => { /* stats indisponibles : l'UI garde les valeurs d'exemple */ });
  };

  // Hébergement assigné : au démarrage puis toutes les 60 s (si l'organisation
  // assigne ou corrige pendant l'événement, l'app se met à jour seule)
  useEffect(() => {
    if (!API_ENABLED || !profile) return;
    let alive = true;
    const load = () => fetchMyHousing()
      .then((h) => { if (alive) setHousing(h); })
      .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, [profile]);

  // Polling : statut de MA question (côté participant)
  useEffect(() => {
    if (!API_ENABLED || !profile) return;
    let alive = true;
    const load = () => fetchMyQuestions()
      .then((rows) => { if (alive && Array.isArray(rows) && rows.length) setMyQuestion(rows[0]); })
      .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => { alive = false; clearInterval(id); };
  }, [profile]);

  // Polling : file des questions (côté pasteur), uniquement si déverrouillé
  useEffect(() => {
    if (!API_ENABLED || !adminUnlocked || !pastorMode) return;
    refreshAdminQueue();
    const id = setInterval(refreshAdminQueue, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUnlocked, pastorMode]);

  // Statistiques organisateur : au chargement du sous-menu, puis rafraîchissement
  useEffect(() => {
    if (!API_ENABLED || !adminUnlocked || plusSubmenu !== 'organisateur') return;
    refreshAdminStats();
    const id = setInterval(refreshAdminStats, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUnlocked, plusSubmenu]);

  // Audio : lecture réelle des fichiers téléversés par les organisateurs
  const audioRef = useRef(null);

  const getAudioEl = () => {
    if (!audioRef.current) {
      const a = new Audio();
      a.addEventListener('timeupdate', () => {
        if (a.duration) setAudioProgress((a.currentTime / a.duration) * 100);
      });
      a.addEventListener('ended', () => {
        setAudioPlaying(false);
        setAudioProgress(0);
      });
      audioRef.current = a;
    }
    return audioRef.current;
  };

  const toggleTrack = (trackId) => {
    const track = (content.audios || []).find(tr => tr.id === trackId);
    const src = track && track.url ? mediaUrl(track.url) : '';
    if (!src) {
      showToast(t('audio_unavailable'));
      return;
    }
    const a = getAudioEl();
    if (audioCurrent === trackId) {
      if (audioPlaying) {
        a.pause();
        setAudioPlaying(false);
      } else {
        a.play().catch(() => {});
        setAudioPlaying(true);
      }
    } else {
      a.src = src;
      a.currentTime = 0;
      a.play().catch(() => {});
      setAudioCurrent(trackId);
      setAudioPlaying(true);
      setAudioProgress(0);
    }
  };

  const closeMiniPlayer = () => {
    if (audioRef.current) audioRef.current.pause();
    setAudioCurrent(null);
    setAudioPlaying(false);
    setAudioProgress(0);
  };

  const tabIsHome = currentTab === 'home';
  const tabIsProgramme = currentTab === 'programme';
  const tabIsSejour = currentTab === 'sejour';
  const tabIsQuestion = currentTab === 'question';
  const tabIsPlus = currentTab === 'plus';

  // Première connexion : création du profil participant (sans mot de passe)
  if (!profile) {
    return (
      <OnboardingScreen
        t={t}
        lang={lang}
        onLangFr={() => setLang('fr')}
        onLangEn={() => setLang('en')}
        onComplete={completeOnboarding}
      />
    );
  }

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F7F5EF',
      fontFamily: "'Poppins', sans-serif",
      maxWidth: '402px',
      margin: '0 auto',
      boxShadow: '0 0 30px rgba(0,0,0,0.1)'
    }}>

      {/* Main content area */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', WebkitOverflowScrolling: 'touch' }}>

        <Header
          tabIsHome={tabIsHome}
          headerTitle={
            tabIsProgramme ? t('programme_title') :
            tabIsSejour ? t('sejour_title') :
            tabIsQuestion ? t('nav_question') :
            plusSubmenu === 'paris' ? t('paris_title') :
            plusSubmenu === 'audios' ? t('audios_title') :
            plusSubmenu === 'pellicule' ? t('pellicule_title') :
            plusSubmenu === 'organisateur' ? t('organisateur_title') :
            plusSubmenu === 'about' ? t('about_title') :
            t('nav_plus')
          }
          headerShowBack={!!plusSubmenu}
          onHeaderBack={() => setPlusSubmenu(null)}
          lang={lang}
          onLangFr={() => setLang('fr')}
          onLangEn={() => setLang('en')}
          onToggleNotif={onToggleNotif}
          hasNotifBadge={hasNotifBadge}
          notifBadgeText={notifBadgeText}
          t={t}
          countdown={countdown}
          nextSession={upcomingSessions(content, 1)[0]}
        />

        <div style={{ padding: '20px 18px 24px' }}>
          {tabIsHome && (
            <HomeTab
              t={t}
              lang={lang}
              content={content}
              onViewProgramme={goProgramme}
              onQuickProgramme={goProgramme}
              onQuickSejour={goSejour}
              onQuickQuestion={goQuestion}
              onQuickParis={() => { goPlus(); setPlusSubmenu('paris'); }}
              onQuickAudios={() => { goPlus(); setPlusSubmenu('audios'); }}
              onQuickPellicule={() => { goPlus(); setPlusSubmenu('pellicule'); }}
              openSession={openSession}
            />
          )}

          {tabIsProgramme && (
            <ProgrammeTab
              t={t}
              lang={lang}
              content={content}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              openSession={openSession}
            />
          )}

          {tabIsSejour && (
            <SejourTab
              t={t}
              lang={lang}
              content={content}
              housing={housing}
            />
          )}

          {tabIsQuestion && (
            <QuestionTab
              t={t}
              lang={lang}
              pastorMode={pastorMode}
              setPastorMode={guardedSetPastorMode}
              questionDraft={questionDraft}
              setQuestionDraft={setQuestionDraft}
              myQuestion={myQuestion}
              setMyQuestion={setMyQuestion}
              submitQuestion={submitQuestion}
              pastorQueue={pastorQueue}
              assigningId={assigningId}
              setAssigningId={setAssigningId}
              assignPlace={assignPlace}
              setAssignPlace={setAssignPlace}
              assignTime={assignTime}
              setAssignTime={setAssignTime}
              assignPastorName={assignPastorName}
              setAssignPastorName={setAssignPastorName}
              confirmAssign={confirmAssign}
            />
          )}

          {tabIsPlus && (
            <PlusTab
              t={t}
              lang={lang}
              submenu={plusSubmenu}
              setSubmenu={guardedSetPlusSubmenu}
              parisSegVenues={parisSegVenues}
              setParisSegVenues={setParisSegVenues}
              audioCurrent={audioCurrent}
              audioPlaying={audioPlaying}
              toggleTrack={toggleTrack}
              pastorQueue={pastorQueue}
              adminStats={adminStats}
              content={content}
              showToast={showToast}
            />
          )}
        </div>
      </div>

      {/* Mini player */}
      {audioCurrent && (
        <MiniPlayer
          t={t}
          content={content}
          audioCurrent={audioCurrent}
          audioPlaying={audioPlaying}
          audioProgress={audioProgress}
          toggleTrack={toggleTrack}
          closeMiniPlayer={closeMiniPlayer}
          lang={lang}
        />
      )}

      {/* Navigation */}
      <Navigation
        currentTab={currentTab}
        goHome={goHome}
        goProgramme={goProgramme}
        goSejour={goSejour}
        goQuestion={goQuestion}
        goPlus={goPlus}
        t={t}
      />

      {/* Notification center */}
      {notifOpen && (
        <NotificationCenter
          onClose={onCloseNotif}
          notifHistory={notifHistory}
          t={t}
        />
      )}

      {/* Admin code modal */}
      {adminModalOpen && (
        <AdminCodeModal
          t={t}
          onSubmit={handleAdminCode}
          onClose={() => { setAdminModalOpen(false); setPendingAdminAction(null); }}
        />
      )}

      {/* Session modal */}
      {openSessionId && (
        <SessionModal
          sessionId={openSessionId}
          content={content}
          onClose={closeSession}
          lang={lang}
          t={t}
          reminders={reminders}
          toggleReminder={toggleReminder}
        />
      )}

      {/* Toasts */}
      <div style={{
        position: 'absolute',
        top: '54px',
        left: '14px',
        right: '14px',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <Toast key={toast.id} text={toast.text} />
        ))}
      </div>
    </div>
  );
}

export default App;
