import MapCard from './MapCard';
import { mediaUrl } from '../data/api';

export default function SejourTab({ t, lang, content, housing }) {
  const sejour = content.sejour;
  const HOTEL_INFO = {
    name: sejour.hotelName,
    address: lang === 'fr' ? sejour.venues.novotel.addressFr : sejour.venues.novotel.addressEn,
    mapQuery: sejour.hotelMapQuery,
    room: sejour.room,
    checkin: sejour.checkin,
    checkout: sejour.checkout,
  };
  const venueNovotel = sejour.venues.novotel;
  const venueCreteil = sejour.venues.creteil;
  const practical = sejour.practical;

  return (
    <>
      <div style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: '19px',
        color: '#12172A',
        textTransform: 'uppercase'
      }}>{t('sejour_title')}</div>

      {/* Hébergement assigné par l'organisation (personnes prises en charge) */}
      {housing && housing.address && (
        <div style={{
          background: '#fff',
          borderRadius: '18px',
          padding: '16px',
          border: '1px solid rgba(18,23,42,0.06)',
          marginTop: '14px'
        }}>
          <div style={{
            display: 'inline-block',
            background: '#E3F7EE',
            color: '#1d7a5c',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '100px',
            marginBottom: '10px'
          }}>{t('sejour_housing_chip')}</div>

          <div style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: '16px',
            color: '#12172A',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>{t('sejour_housing_title')}</div>

          <div style={{ height: '120px' }}>
            <MapCard
              label={t('sejour_housing_title')}
              address={housing.address}
              directions
              linkLabel={t('sejour_housing_directions')}
            />
          </div>

          {housing.notes && (
            <div style={{ marginTop: '12px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'rgba(18,23,42,0.45)',
                textTransform: 'uppercase'
              }}>{t('sejour_housing_notes_label')}</div>
              <div style={{
                fontSize: '13px',
                color: '#12172A',
                marginTop: '3px',
                lineHeight: '1.4'
              }}>{housing.notes}</div>
            </div>
          )}
        </div>
      )}

      <div style={{
        background: '#fff',
        borderRadius: '18px',
        padding: '16px',
        border: '1px solid rgba(18,23,42,0.06)',
        marginTop: '14px'
      }}>
        {sejour.hotelPhotoUrl ? (
          <img
            src={mediaUrl(sejour.hotelPhotoUrl)}
            alt={sejour.hotelName}
            style={{
              width: '100%',
              height: '140px',
              objectFit: 'cover',
              borderRadius: '14px',
              marginBottom: '14px'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '140px',
            background: 'linear-gradient(135deg, #0E1B38 0%, #2FBF8F 100%)',
            borderRadius: '14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600
          }}>
            Photo de l'hôtel
          </div>
        )}

        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#12172A'
        }}>{HOTEL_INFO.name}</div>

        <div style={{ marginTop: '12px', height: '112px' }}>
          <MapCard
            label={HOTEL_INFO.name}
            address={HOTEL_INFO.address}
            mapQuery={HOTEL_INFO.mapQuery}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '14px'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(18,23,42,0.45)',
              textTransform: 'uppercase'
            }}>{t('sejour_room_label')}</div>
            <div style={{
              fontSize: '13.5px',
              color: '#12172A',
              marginTop: '3px',
              fontWeight: 600
            }}>{HOTEL_INFO.room}</div>
          </div>

          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(18,23,42,0.45)',
              textTransform: 'uppercase'
            }}>{t('sejour_checkin_label')}</div>
            <div style={{
              fontSize: '13px',
              color: '#12172A',
              marginTop: '3px'
            }}>{HOTEL_INFO.checkin}</div>
          </div>

          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(18,23,42,0.45)',
              textTransform: 'uppercase'
            }}>{t('sejour_checkout_label')}</div>
            <div style={{
              fontSize: '13px',
              color: '#12172A',
              marginTop: '3px'
            }}>{HOTEL_INFO.checkout}</div>
          </div>
        </div>
      </div>

      <div style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: '16px',
        color: '#12172A',
        textTransform: 'uppercase',
        marginTop: '22px',
        marginBottom: '10px'
      }}>{t('sejour_practical_title')}</div>

      <div style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid rgba(18,23,42,0.06)',
        overflow: 'hidden'
      }}>
        <PracticalInfoRow
          label={t('practical_wifi_label')}
          value={practical.wifi[lang]}
          showBorder
        />
        <PracticalInfoRow
          label={t('practical_breakfast_label')}
          value={practical.breakfast[lang]}
          showBorder
        />
        <PracticalInfoRow
          label={t('practical_shuttle_label')}
          value={practical.shuttle[lang]}
          showBorder
        />
        <PracticalInfoRow
          label={t('practical_reception_label')}
          value={practical.reception[lang]}
        />
      </div>

      <div style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: '16px',
        color: '#12172A',
        textTransform: 'uppercase',
        marginTop: '22px',
        marginBottom: '10px'
      }}>{t('sejour_venues_title')}</div>

      <div style={{ height: '112px', marginBottom: '12px' }}>
        <MapCard
          label={lang === 'fr' ? venueNovotel.nameFr : venueNovotel.nameEn}
          address={lang === 'fr' ? venueNovotel.addressFr : venueNovotel.addressEn}
          mapQuery={venueNovotel.mapQuery}
        />
      </div>

      <div style={{ height: '112px' }}>
        <MapCard
          label={lang === 'fr' ? venueCreteil.nameFr : venueCreteil.nameEn}
          address={lang === 'fr' ? venueCreteil.addressFr : venueCreteil.addressEn}
          mapQuery={venueCreteil.mapQuery}
        />
      </div>
    </>
  );
}

function PracticalInfoRow({ label, value, showBorder = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: '10px',
      padding: '13px 14px',
      borderBottom: showBorder ? '1px solid rgba(18,23,42,0.06)' : 'none'
    }}>
      <div style={{
        fontSize: '12.5px',
        fontWeight: 700,
        color: '#12172A',
        flex: 'none'
      }}>{label}</div>
      <div style={{
        fontSize: '12px',
        color: 'rgba(18,23,42,0.6)',
        textAlign: 'right'
      }}>{value}</div>
    </div>
  );
}
