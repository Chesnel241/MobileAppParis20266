export default function MapCard({ label, address, mapQuery, directions = false, linkLabel }) {
  // Mode itinéraire : ouvre la navigation GPS depuis la position actuelle du participant
  const query = mapQuery || encodeURIComponent(address || label || '');
  const googleMapsUrl = directions
    ? `https://www.google.com/maps/dir/?api=1&destination=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;
  const cta = linkLabel || (directions ? 'Itinéraire GPS' : 'Ouvrir dans Maps');

  return (
    <a
      href={googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0E1B38 0%, #16305A 100%)',
        borderRadius: '14px',
        padding: '14px',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(18,23,42,0.1)'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)'
      }}></div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '6px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F2E94E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#fff'
            }}>{label}</div>
          </div>
          <div style={{
            fontSize: '11.5px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: '1.4'
          }}>{address}</div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#F2E94E',
          marginTop: '8px'
        }}>
          <span>{cta}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2E94E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M7 7h10v10"></path>
          </svg>
        </div>
      </div>
    </a>
  );
}
