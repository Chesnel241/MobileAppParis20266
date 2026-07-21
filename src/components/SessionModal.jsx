import { useEffect, useRef } from 'react';
import { sessionTimeRange } from '../data/defaultContent';

export default function SessionModal({ sessionId, content, onClose, lang, t, reminders, toggleReminder }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const session = (content.sessions || []).find(s => s.id === sessionId);

  useEffect(() => {
    if (!session) return undefined;
    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [session]);

  if (!session) return null;

  const title = lang === 'fr' ? session.tFr : session.tEn;
  const speaker = lang === 'fr' ? session.spFr : session.spEn;
  const location = lang === 'fr' ? session.locFr : session.locEn;

  const timeRange = sessionTimeRange(session);

  const hasReminder = reminders.has(sessionId);
  const reminderLabel = hasReminder ? t('modal_reminder_remove') : t('modal_reminder_add');

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 45,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    }}>
      <button type="button" className="ui-button-reset" onClick={onClose} aria-label={t('modal_close')} style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(14,27,56,0.55)',
        width: '100%'
      }}></button>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-dialog-title"
        tabIndex={-1}
        style={{
        position: 'relative',
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '22px 20px 30px',
        zIndex: 1,
        maxHeight: '80%',
        overflow: 'auto'
      }}>
        <div aria-hidden="true" style={{
          width: '40px',
          height: '5px',
          borderRadius: '3px',
          background: 'rgba(18,23,42,0.15)',
          margin: '0 auto 16px'
        }}></div>

        <div id="session-dialog-title" style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '19px',
          color: '#12172A',
          textTransform: 'uppercase',
          lineHeight: '1.2'
        }}>{title}</div>

        <div style={{
          fontSize: '13px',
          color: 'rgba(18,23,42,0.55)',
          marginTop: '6px'
        }}>{timeRange}</div>

        {speaker && (
          <div style={{ marginTop: '14px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(18,23,42,0.45)',
              textTransform: 'uppercase'
            }}>{t('modal_speaker_label')}</div>
            <div style={{
              fontSize: '14px',
              color: '#12172A',
              marginTop: '2px'
            }}>{speaker}</div>
          </div>
        )}

        <div style={{ marginTop: '14px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'rgba(18,23,42,0.45)',
            textTransform: 'uppercase'
          }}>{t('modal_location_label')}</div>
          <div style={{
            fontSize: '14px',
            color: '#12172A',
            marginTop: '2px'
          }}>{location}</div>
        </div>

        <button
          type="button"
          className="ui-button-reset"
          onClick={() => toggleReminder(sessionId)}
          aria-pressed={hasReminder}
          style={{
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: '#0E1B38',
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          padding: '14px',
          borderRadius: '100px',
          cursor: 'pointer',
          width: '100%'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span>{reminderLabel}</span>
        </button>

        <button type="button" className="ui-button-reset" onClick={onClose} style={{
          marginTop: '8px',
          textAlign: 'center',
          color: 'rgba(18,23,42,0.5)',
          fontSize: '13px',
          fontWeight: 600,
          padding: '10px',
          cursor: 'pointer',
          width: '100%'
        }}>{t('modal_close')}</button>
      </div>
    </div>
  );
}
