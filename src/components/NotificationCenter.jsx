import { useEffect, useRef } from 'react';

export default function NotificationCenter({ onClose, notifHistory, t, pushState, onEnablePush }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
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
  }, []);

  return (
    <>
      <button
        type="button"
        className="ui-button-reset"
        onClick={onClose}
        aria-label={t('modal_close')}
        style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        width: '100%',
        background: 'rgba(0,0,0,0.01)'
      }}></button>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-dialog-title"
        tabIndex={-1}
        style={{
        position: 'absolute',
        top: '100px',
        right: '14px',
        width: '250px',
        maxHeight: '320px',
        overflow: 'auto',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.28)',
        zIndex: 41,
        padding: '6px'
      }}>
        <div id="notification-dialog-title" style={{
          padding: '10px 12px',
          fontWeight: 700,
          fontSize: '13px',
          color: '#12172A'
        }}>
          {t('notif_center_title')}
        </div>
        <button
          type="button"
          className="sr-only"
          onClick={onClose}
        >{t('modal_close')}</button>

        {/* Activation des notifications push (le clic est requis par iOS) */}
        {pushState && pushState.visible && (
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(18,23,42,0.06)',
            background: '#F7F5EF'
          }}>
            {pushState.enabled ? (
              <div style={{ fontSize: '11.5px', color: '#1d7a5c', fontWeight: 600 }}>
                ✓ {t('push_enabled')}
              </div>
            ) : pushState.reason === 'ios_needs_install' ? (
              <div style={{ fontSize: '11.5px', color: 'rgba(18,23,42,0.65)', lineHeight: 1.4 }}>
                {t('push_ios_install')}
              </div>
            ) : pushState.reason === 'denied' ? (
              <div style={{ fontSize: '11.5px', color: 'rgba(18,23,42,0.65)', lineHeight: 1.4 }}>
                {t('push_denied')}
              </div>
            ) : (
              <button
                type="button"
                className="ui-button-reset"
                onClick={onEnablePush}
                disabled={pushState.busy}
                style={{
                  width: '100%',
                  background: '#0E1B38',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '12px',
                  padding: '9px',
                  borderRadius: '100px',
                  cursor: pushState.busy ? 'wait' : 'pointer'
                }}
              >{pushState.busy ? '…' : t('push_enable')}</button>
            )}
          </div>
        )}

        {notifHistory.length === 0 && (
          <div style={{
            padding: '10px 12px',
            fontSize: '12px',
            color: 'rgba(18,23,42,0.45)',
            borderTop: '1px solid rgba(18,23,42,0.06)'
          }}>{t('notif_empty')}</div>
        )}
        {notifHistory.map((n, i) => (
          <div key={i} style={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(18,23,42,0.06)'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#12172A',
              lineHeight: '1.35'
            }}>
              {n.text}
            </div>
            <div style={{
              fontSize: '10px',
              color: 'rgba(18,23,42,0.45)',
              marginTop: '3px'
            }}>
              {n.time}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
