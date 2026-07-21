export default function MiniPlayer({ t, content, audioCurrent, audioPlaying, audioProgress, toggleTrack, closeMiniPlayer, lang }) {
  const track = (content.audios || []).find(tr => tr.id === audioCurrent);
  if (!track) return null;

  const title = lang === 'fr' ? track.titleFr : track.titleEn;

  return (
    <div style={{
      flex: 'none',
      background: '#0E1B38',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '2px',
        background: '#EA4630',
        width: `${audioProgress}%`
      }}></div>

      <div onClick={() => toggleTrack(audioCurrent)} style={{
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        cursor: 'pointer'
      }}>
        {audioPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0E1B38">
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0E1B38">
            <polygon points="6 3 20 12 6 21 6 3"></polygon>
          </svg>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>{title}</div>
        <div style={{
          fontSize: '10.5px',
          color: 'rgba(255,255,255,0.55)'
        }}>{t('audios_playing')}</div>
      </div>

      <div onClick={closeMiniPlayer} style={{
        width: '26px',
        height: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flex: 'none'
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </div>
    </div>
  );
}
