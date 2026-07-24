// Fenêtre d'annonce importante. C'est le canal de diffusion garanti : contrairement
// aux notifications push (que tous les participants n'activent pas), elle s'affiche
// au premier plan dès que la personne est dans l'application. Elle ne réapparaît
// plus une fois que le participant l'a lue (« J'ai compris »).

export default function AnnouncementModal({ announcement, lang, onAcknowledge }) {
  if (!announcement) return null;
  const fr = lang === 'fr';
  const title = (fr ? announcement.titleFr : announcement.titleEn) || (fr ? 'Annonce importante' : 'Important announcement');
  const body = fr ? announcement.fr : (announcement.en || announcement.fr);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(10,16,34,0.72)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '22px',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: '#fff',
        borderRadius: '22px',
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(10,16,34,0.4)',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0E1B38 0%, #23407a 100%)',
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ fontSize: '26px', lineHeight: 1 }} aria-hidden="true">📣</div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{title}</div>
        </div>

        <div style={{ padding: '20px 22px 22px' }}>
          <div style={{
            fontSize: '15px',
            color: '#12172A',
            lineHeight: '1.55',
            whiteSpace: 'pre-wrap',
          }}>{body}</div>

          <button
            type="button"
            onClick={onAcknowledge}
            style={{
              width: '100%',
              marginTop: '22px',
              background: '#E84A32',
              color: '#fff',
              border: 0,
              borderRadius: '100px',
              padding: '15px',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >{fr ? "J'ai compris" : 'Got it'}</button>
        </div>
      </div>
    </div>
  );
}
