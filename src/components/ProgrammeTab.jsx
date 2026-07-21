import { sessionTimeRange } from '../data/defaultContent';

export default function ProgrammeTab({ t, lang, content, selectedDay, setSelectedDay, openSession }) {
  const DAYS = content.days || [];
  const SESSIONS = content.sessions || [];
  const daySessions = SESSIONS.filter(s => s.dayId === selectedDay);
  const selectedDayData = DAYS.find(d => d.id === selectedDay);

  const phaseLabel = selectedDayData?.phase === 'convention'
    ? t('phase_convention')
    : t('phase_formation');

  const fullDayLabel = lang === 'fr' ? selectedDayData?.fullFr : selectedDayData?.fullEn;

  return (
    <>
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '6px'
      }}>
        {DAYS.map(day => {
          const isSelected = selectedDay === day.id;
          const label = lang === 'fr' ? day.dFr : day.dEn;

          return (
            <div
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              style={{
                flex: 'none',
                padding: '9px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: isSelected ? '#0E1B38' : '#fff',
                color: isSelected ? '#fff' : '#12172A',
                border: isSelected ? 'none' : '1px solid rgba(18,23,42,0.1)'
              }}
            >
              {label}
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'inline-block',
        background: '#F2E94E',
        color: '#12172A',
        fontSize: '11px',
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: '100px',
        marginTop: '12px'
      }}>{phaseLabel}</div>

      <div style={{
        fontSize: '13px',
        color: 'rgba(18,23,42,0.5)',
        marginTop: '8px',
        marginBottom: '6px'
      }}>{fullDayLabel}</div>

      <div>
        {daySessions.map((session, idx) => {
          const title = lang === 'fr' ? session.tFr : session.tEn;
          const location = lang === 'fr' ? session.locFr : session.locEn;
          const timeRange = sessionTimeRange(session);

          return (
            <div
              key={session.id}
              onClick={() => openSession(session.id)}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '14px 0',
                borderBottom: idx < daySessions.length - 1 ? '1px solid rgba(18,23,42,0.07)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: '60px', flex: 'none' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#12172A'
                }}>{timeRange.split(' - ')[0]}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14.5px',
                  fontWeight: 600,
                  color: '#12172A',
                  lineHeight: '1.3'
                }}>{title}</div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(18,23,42,0.55)',
                  marginTop: '3px'
                }}>{location}</div>
              </div>
            </div>
          );
        })}

        {daySessions.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(18,23,42,0.4)',
            fontSize: '13px'
          }}>
            Aucune session pour cette journée
          </div>
        )}
      </div>
    </>
  );
}
