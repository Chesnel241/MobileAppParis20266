import { useState } from 'react';
import { COUNTRIES } from '../data/constants';

const inputStyle = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: '12px',
  border: '1px solid rgba(18,23,42,0.15)',
  fontFamily: "'Poppins', sans-serif",
  fontSize: '14px',
  color: '#12172A',
  background: '#fff',
  boxSizing: 'border-box'
};

const labelStyle = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(18,23,42,0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: '14px 0 5px'
};

export default function OnboardingScreen({ t, lang, onLangFr, onLangEn, onComplete }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');

  const canSubmit = firstName.trim() && lastName.trim() && phone.trim() && country;

  const submit = () => {
    if (!canSubmit) {
      setError(t('onboarding_error_required'));
      return;
    }
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 6) {
      setError(t('onboarding_error_phone'));
      return;
    }
    const countryEntry = COUNTRIES.find(c => c.code === country);
    onComplete({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      country: country,
      countryLabel: countryEntry ? countryEntry[lang] : country,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0E1B38',
      fontFamily: "'Poppins', sans-serif",
      maxWidth: '402px',
      margin: '0 auto',
      boxShadow: '0 0 30px rgba(0,0,0,0.1)',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* Top bar : logo + langue */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'calc(18px + env(safe-area-inset-top)) 20px 0'
      }}>
        <img src="/uploads/logo_lwmfd.png" alt="Life Word Mission France & Diaspora" style={{ height: '40px' }} />
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '100px',
          padding: '3px'
        }}>
          {[['fr', 'FR', onLangFr], ['en', 'EN', onLangEn]].map(([code, label, onClick]) => (
            <div key={code} onClick={onClick} style={{
              padding: '5px 12px',
              borderRadius: '100px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              background: lang === code ? '#F2E94E' : 'transparent',
              color: lang === code ? '#12172A' : 'rgba(255,255,255,0.7)'
            }}>{label}</div>
          ))}
        </div>
      </div>

      {/* Titre */}
      <div style={{ padding: '26px 24px 20px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          color: '#F2E94E'
        }}>{t('onboarding_kicker')}</div>
        <div style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '32px',
          color: '#fff',
          textTransform: 'uppercase',
          marginTop: '6px',
          lineHeight: 1.1
        }}>{t('onboarding_title')}</div>
        <div style={{
          fontSize: '13.5px',
          color: 'rgba(255,255,255,0.75)',
          marginTop: '10px',
          lineHeight: 1.5
        }}>{t('onboarding_subtitle')}</div>
      </div>

      {/* Formulaire */}
      <div style={{
        background: '#F7F5EF',
        borderRadius: '24px 24px 0 0',
        padding: '22px 22px calc(28px + env(safe-area-inset-bottom))',
        flex: 1
      }}>
        <div style={labelStyle}>{t('onboarding_lastname')}</div>
        <input
          value={lastName}
          onChange={(e) => { setLastName(e.target.value); setError(''); }}
          autoComplete="family-name"
          style={inputStyle}
        />

        <div style={labelStyle}>{t('onboarding_firstname')}</div>
        <input
          value={firstName}
          onChange={(e) => { setFirstName(e.target.value); setError(''); }}
          autoComplete="given-name"
          style={inputStyle}
        />

        <div style={labelStyle}>{t('onboarding_phone')}</div>
        <input
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setError(''); }}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+33 6 12 34 56 78"
          style={inputStyle}
        />

        <div style={labelStyle}>{t('onboarding_country')}</div>
        <select
          value={country}
          onChange={(e) => { setCountry(e.target.value); setError(''); }}
          style={{ ...inputStyle, appearance: 'auto' }}
        >
          <option value="">{t('onboarding_country_placeholder')}</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c[lang]}</option>
          ))}
        </select>

        {error && (
          <div style={{
            marginTop: '12px',
            color: '#EA4630',
            fontSize: '12.5px',
            fontWeight: 600
          }}>{error}</div>
        )}

        <div onClick={submit} style={{
          marginTop: '20px',
          background: canSubmit ? '#0E1B38' : 'rgba(18,23,42,0.15)',
          color: canSubmit ? '#fff' : 'rgba(18,23,42,0.4)',
          fontWeight: 700,
          textAlign: 'center',
          padding: '15px',
          borderRadius: '100px',
          cursor: canSubmit ? 'pointer' : 'not-allowed'
        }}>{t('onboarding_submit')}</div>

        <div style={{
          marginTop: '14px',
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'rgba(18,23,42,0.45)'
        }}>
          {t('onboarding_footer')}{' '}
          <a href="/privacy.html" target="_blank" rel="noopener" style={{
            color: 'rgba(18,23,42,0.6)',
            textDecoration: 'underline'
          }}>{t('about_privacy_link')}</a>
        </div>
      </div>
    </div>
  );
}
