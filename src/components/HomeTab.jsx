import { upcomingSessions as computeUpcoming, sessionTimeRange } from '../data/defaultContent';

export default function HomeTab({
  t,
  lang,
  content,
  onViewProgramme,
  onQuickProgramme,
  onQuickSejour,
  onQuickQuestion,
  onQuickParis,
  onQuickAudios,
  onQuickPellicule,
  openSession
}) {
  const upcomingSessions = computeUpcoming(content, 3);

  return (
    <>
      <button type="button" className="ui-button-reset" onClick={onViewProgramme} style={{
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: '#EA4630',
        color: '#fff',
        fontWeight: 700,
        fontSize: '13.5px',
        padding: '12px',
        borderRadius: '100px',
        cursor: 'pointer',
        width: '100%'
      }}>
        <span>{t('home_view_programme')}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6"></path>
        </svg>
      </button>

      <div style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: '15px',
        color: '#12172A',
        textTransform: 'uppercase',
        marginBottom: '12px'
      }}>{t('home_quick_title')}</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '10px',
        marginBottom: '24px'
      }}>
        <QuickActionCard
          onClick={onQuickProgramme}
          icon={<CalendarIcon />}
          label={t('quick_programme')}
        />
        <QuickActionCard
          onClick={onQuickSejour}
          icon={<HotelIcon />}
          label={t('quick_sejour')}
        />
        <QuickActionCard
          onClick={onQuickQuestion}
          icon={<QuestionIcon />}
          label={t('quick_question')}
        />
        <QuickActionCard
          onClick={onQuickParis}
          icon={<MapIcon />}
          label={t('quick_paris')}
        />
        <QuickActionCard
          onClick={onQuickAudios}
          icon={<MicIcon />}
          label={t('quick_audios')}
        />
        <QuickActionCard
          onClick={onQuickPellicule}
          icon={<CameraIcon />}
          label={t('plus_pellicule_title')}
        />
      </div>

      <div style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: '15px',
        color: '#12172A',
        textTransform: 'uppercase',
        marginBottom: '12px'
      }}>{t('home_upcoming_title')}</div>

      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid rgba(18,23,42,0.06)',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        {upcomingSessions.map((session, idx) => (
          <button
            type="button"
            className="ui-button-reset"
            key={session.id}
            onClick={() => openSession(session.id)}
            aria-label={`${lang === 'fr' ? session.tFr : session.tEn}, ${sessionTimeRange(session)}`}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '13px 14px',
              borderBottom: idx < upcomingSessions.length - 1 ? '1px solid rgba(18,23,42,0.06)' : 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <span style={{
              display: 'block',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#EA4630',
              width: '50px',
              flex: 'none'
            }}>
              {sessionTimeRange(session).split(' - ')[0]}
            </span>
            <span style={{ display: 'block', flex: 1, minWidth: 0 }}>
              <span style={{
                display: 'block',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#12172A'
              }}>{lang === 'fr' ? session.tFr : session.tEn}</span>
              <span style={{
                display: 'block',
                fontSize: '11.5px',
                color: 'rgba(18,23,42,0.5)',
                marginTop: '2px'
              }}>{lang === 'fr' ? session.locFr : session.locEn}</span>
            </span>
          </button>
        ))}

        {upcomingSessions.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '24px 16px',
            color: 'rgba(18,23,42,0.4)',
            fontSize: '13px'
          }}>{t('home_no_upcoming')}</div>
        )}
      </div>
    </>
  );
}

function QuickActionCard({ onClick, icon, label }) {
  return (
    <button type="button" className="ui-button-reset" onClick={onClick} aria-label={label} style={{
      display: 'block',
      width: '100%',
      background: '#fff',
      borderRadius: '16px',
      padding: '14px 6px',
      textAlign: 'center',
      border: '1px solid rgba(18,23,42,0.06)',
      cursor: 'pointer'
    }}>
      <span style={{
        width: '38px',
        height: '38px',
        borderRadius: '11px',
        background: '#0E1B38',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 8px'
      }}>
        {icon}
      </span>
      <span style={{
        display: 'block',
        fontSize: '10.5px',
        fontWeight: 600,
        color: '#12172A',
        lineHeight: '1.25'
      }}>{label}</span>
    </button>
  );
}

function CalendarIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"></rect>
      <path d="M16 2v4M8 2v4M3 10h18"></path>
    </svg>
  );
}

function HotelIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"></path>
      <path d="M3 18h18M3 12h18"></path>
      <path d="M7 10V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"></path>
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-9.5 8.31A8.5 8.5 0 1 1 21 11.5z"></path>
      <path d="M12 8v4M12 16h.01"></path>
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3"></rect>
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8"></path>
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );
}
