export default function NotificationCenter({ onClose, notifHistory, t }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        background: 'rgba(0,0,0,0.01)'
      }}></div>
      <div style={{
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
        <div style={{
          padding: '10px 12px',
          fontWeight: 700,
          fontSize: '13px',
          color: '#12172A'
        }}>
          {t('notif_center_title')}
        </div>
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
