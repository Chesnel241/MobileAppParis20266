import { useState } from 'react';

export default function AdminCodeModal({ t, onSubmit, onClose }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div onClick={onClose} style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(14,27,56,0.55)',
      zIndex: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '22px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
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

        <div style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '18px',
          color: '#12172A',
          textTransform: 'uppercase'
        }}>{t('admin_modal_title')}</div>

        <div style={{
          fontSize: '13px',
          color: 'rgba(18,23,42,0.65)',
          marginTop: '8px',
          lineHeight: 1.5
        }}>{t('admin_modal_body')}</div>

        <input
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          type="password"
          autoFocus
          placeholder={t('admin_modal_placeholder')}
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
          <div style={{
            marginTop: '8px',
            color: '#EA4630',
            fontSize: '12.5px',
            fontWeight: 600
          }}>{t('admin_modal_error')}</div>
        )}

        <div onClick={submit} style={{
          marginTop: '16px',
          background: code.trim() && !loading ? '#0E1B38' : 'rgba(18,23,42,0.15)',
          color: code.trim() && !loading ? '#fff' : 'rgba(18,23,42,0.4)',
          fontWeight: 700,
          textAlign: 'center',
          padding: '14px',
          borderRadius: '100px',
          cursor: code.trim() && !loading ? 'pointer' : 'not-allowed'
        }}>{loading ? '…' : t('admin_modal_submit')}</div>

        <div onClick={onClose} style={{
          marginTop: '10px',
          textAlign: 'center',
          color: 'rgba(18,23,42,0.5)',
          fontSize: '13px',
          fontWeight: 600,
          padding: '8px',
          cursor: 'pointer'
        }}>{t('admin_modal_cancel')}</div>
      </div>
    </div>
  );
}
