export default function Header({
  showCompact,
  tabIsHome,
  headerTitle,
  headerShowBack,
  onHeaderBack,
  lang,
  onLangFr,
  onLangEn,
  onToggleNotif,
  hasNotifBadge,
  notifBadgeText,
  t,
  countdown,
  nextSession
}) {
  const nextTitle = nextSession ? (lang === 'fr' ? nextSession.tFr : nextSession.tEn) : "Cérémonie d'ouverture";
  const nextLoc = nextSession ? (lang === 'fr' ? nextSession.locFr : nextSession.locEn) : "Amphithéâtre Novotel";
  const langFrBg = lang === 'fr' ? '#fff' : 'transparent';
  const langFrFg = lang === 'fr' ? '#0E1B38' : 'rgba(255,255,255,0.7)';
  const langEnBg = lang === 'en' ? '#fff' : 'transparent';
  const langEnFg = lang === 'en' ? '#0E1B38' : 'rgba(255,255,255,0.7)';

  if (tabIsHome) {
    return (
      <div style={{
        position: 'relative',
        padding: '56px 20px 26px',
        background: 'linear-gradient(160deg,#0E1B38 0%,#16305A 45%,#2FBF8F 140%)',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)'
        }}></div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            background: '#fff',
            borderRadius: '100px',
            padding: '6px 14px 6px 7px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
          }}>
            <img src="/uploads/logo_lwmfd.png" alt="Life Word Mission France & Diaspora" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
            <div style={{ width: '1px', height: '20px', background: 'rgba(18,23,42,0.15)' }}></div>
            <img src="/uploads/img7-removebg-preview.png" alt="Convention Internationale Paris 2026" style={{ height: '22px', objectFit: 'contain' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '100px',
              padding: '3px'
            }}>
              <div onClick={onLangFr} style={{
                padding: '5px 10px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                background: langFrBg,
                color: langFrFg
              }}>FR</div>
              <div onClick={onLangEn} style={{
                padding: '5px 10px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                background: langEnBg,
                color: langEnFg
              }}>EN</div>
            </div>

            <div onClick={onToggleNotif} style={{
              position: 'relative',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {hasNotifBadge && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#EA4630',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 700,
                  minWidth: '15px',
                  height: '15px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  border: '2px solid #16305A'
                }}>{notifBadgeText}</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '22px', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: '#F2E94E'
          }}>{t('home_kicker')}</div>
          <div style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: '29px',
            lineHeight: '1.08',
            color: '#fff',
            marginTop: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}>
            Né mort, mourir <span style={{ color: '#F2E94E' }}>vivant</span>
          </div>
          <div style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.85)',
            marginTop: '8px'
          }}>{t('home_welcome')}</div>
        </div>

        <div style={{
          marginTop: '20px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '20px',
          padding: '18px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'rgba(255,255,255,0.65)'
          }}>{t('home_next_label')}</div>
          <div style={{
            fontSize: '17px',
            fontWeight: 600,
            color: '#fff',
            marginTop: '4px'
          }}>{nextTitle}</div>
          <div style={{
            fontSize: '12.5px',
            color: 'rgba(255,255,255,0.7)',
            marginTop: '2px'
          }}>{nextLoc}</div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <div style={{
              flex: 1,
              background: 'rgba(0,0,0,0.18)',
              borderRadius: '12px',
              padding: '10px 0',
              textAlign: 'center'
            }}>
              <div style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: '22px',
                color: '#fff'
              }}>{String(countdown.days).padStart(2, '0')}</div>
              <div style={{
                fontSize: '9px',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                marginTop: '2px',
                fontWeight: 600
              }}>{t('countdown_days')}</div>
            </div>

            <div style={{
              flex: 1,
              background: 'rgba(0,0,0,0.18)',
              borderRadius: '12px',
              padding: '10px 0',
              textAlign: 'center'
            }}>
              <div style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: '22px',
                color: '#fff'
              }}>{String(countdown.hours).padStart(2, '0')}</div>
              <div style={{
                fontSize: '9px',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                marginTop: '2px',
                fontWeight: 600
              }}>{t('countdown_hours')}</div>
            </div>

            <div style={{
              flex: 1,
              background: 'rgba(0,0,0,0.18)',
              borderRadius: '12px',
              padding: '10px 0',
              textAlign: 'center'
            }}>
              <div style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: '22px',
                color: '#fff'
              }}>{String(countdown.mins).padStart(2, '0')}</div>
              <div style={{
                fontSize: '9px',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                marginTop: '2px',
                fontWeight: 600
              }}>{t('countdown_mins')}</div>
            </div>

            <div style={{
              flex: 1,
              background: 'rgba(0,0,0,0.18)',
              borderRadius: '12px',
              padding: '10px 0',
              textAlign: 'center'
            }}>
              <div style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: '22px',
                color: '#fff'
              }}>{String(countdown.secs).padStart(2, '0')}</div>
              <div style={{
                fontSize: '9px',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                marginTop: '2px',
                fontWeight: 600
              }}>{t('countdown_secs')}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact header for other tabs
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 5,
      background: '#0E1B38',
      padding: '54px 18px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: 0
      }}>
        {headerShowBack && (
          <div onClick={onHeaderBack} style={{ cursor: 'pointer', flex: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
          </div>
        )}
        <div style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '21px',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>{headerTitle}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 'none' }}>
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '100px',
          padding: '3px'
        }}>
          <div onClick={onLangFr} style={{
            padding: '5px 10px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            background: langFrBg,
            color: langFrFg
          }}>FR</div>
          <div onClick={onLangEn} style={{
            padding: '5px 10px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            background: langEnBg,
            color: langEnFg
          }}>EN</div>
        </div>

        <div onClick={onToggleNotif} style={{
          position: 'relative',
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {hasNotifBadge && (
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: '#EA4630',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 700,
              minWidth: '15px',
              height: '15px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              border: '2px solid #0E1B38'
            }}>{notifBadgeText}</div>
          )}
        </div>
      </div>
    </div>
  );
}
