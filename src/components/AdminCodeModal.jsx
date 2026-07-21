import { useEffect, useRef, useState } from 'react';

export default function AdminCodeModal({ t, onSubmit, onClose }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  const submit = () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(false);
    onSubmit(code.trim(), (ok) => {
      setLoading(false);
      if (!ok) {
        setError(true);
        setCode('');
      }
    });
  };

  return (
    <div role="presentation" style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(14,27,56,0.55)',
      zIndex: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <button
        type="button"
        className="ui-button-reset"
        onClick={onClose}
        aria-label={t('admin_modal_cancel')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%'
        }}
      ></button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        aria-describedby="admin-dialog-description"
        style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '22px',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1
      }}>
        <div aria-hidden="true" style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: '#0E1B38',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2E94E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <div id="admin-dialog-title" style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '18px',
          color: '#12172A',
          textTransform: 'uppercase'
        }}>{t('admin_modal_title')}</div>

        <div id="admin-dialog-description" style={{
          fontSize: '13px',
          color: 'rgba(18,23,42,0.65)',
          marginTop: '8px',
          lineHeight: 1.5
        }}>{t('admin_modal_body')}</div>

        <label className="sr-only" htmlFor="admin-code-input">{t('admin_modal_placeholder')}</label>
        <input
          id="admin-code-input"
          name="adminCode"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          type="password"
          autoFocus
          placeholder={t('admin_modal_placeholder')}
          aria-invalid={error}
          aria-describedby={error ? 'admin-dialog-description admin-code-error' : 'admin-dialog-description'}
          style={{
            width: '100%',
            padding: '13px 14px',
            borderRadius: '12px',
            border: `1px solid ${error ? '#EA4630' : 'rgba(18,23,42,0.15)'}`,
            fontFamily: "'Poppins', sans-serif",
            fontSize: '14px',
            color: '#12172A',
            boxSizing: 'border-box',
            marginTop: '16px',
            letterSpacing: '2px'
          }}
        />

        {error && (
          <div id="admin-code-error" role="alert" style={{
            marginTop: '8px',
            color: '#EA4630',
            fontSize: '12.5px',
            fontWeight: 600
          }}>{t('admin_modal_error')}</div>
        )}

        <button
          type="button"
          className="ui-button-reset"
          onClick={submit}
          aria-disabled={!code.trim() || loading}
          style={{
          marginTop: '16px',
          background: code.trim() && !loading ? '#0E1B38' : 'rgba(18,23,42,0.15)',
          color: code.trim() && !loading ? '#fff' : 'rgba(18,23,42,0.4)',
          fontWeight: 700,
          textAlign: 'center',
          padding: '14px',
          borderRadius: '100px',
          cursor: code.trim() && !loading ? 'pointer' : 'not-allowed',
          width: '100%'
        }}>{loading ? '…' : t('admin_modal_submit')}</button>

        <button type="button" className="ui-button-reset" onClick={onClose} style={{
          marginTop: '10px',
          textAlign: 'center',
          color: 'rgba(18,23,42,0.5)',
          fontSize: '13px',
          fontWeight: 600,
          padding: '8px',
          cursor: 'pointer',
          width: '100%'
        }}>{t('admin_modal_cancel')}</button>
      </div>
    </div>
  );
}
