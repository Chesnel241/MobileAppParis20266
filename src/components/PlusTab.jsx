import MapCard from './MapCard';
import PelliculeTab from './PelliculeTab';

export default function PlusTab({
  t,
  lang,
  content,
  submenu,
  setSubmenu,
  parisSegVenues,
  setParisSegVenues,
  audioCurrent,
  audioPlaying,
  toggleTrack,
  pastorQueue,
  adminStats,
  showToast
}) {
  const LANDMARKS = content.paris.landmarks || [];
  const AUDIO_TRACKS = content.audios || [];
  const venueNovotel = content.sejour.venues.novotel;
  const venueCreteil = content.sejour.venues.creteil;
  const about = content.about;

  // Main Plus menu
  if (!submenu) {
    return (
      <>
        <MenuCard
          onClick={() => setSubmenu('paris')}
          icon={<MapIcon />}
          title={t('plus_paris_title')}
          description={t('plus_paris_desc')}
        />
        <MenuCard
          onClick={() => setSubmenu('audios')}
          icon={<MicIcon />}
          title={t('plus_audios_title')}
          description={t('plus_audios_desc')}
        />
        <MenuCard
          onClick={() => setSubmenu('pellicule')}
          icon={<CameraIcon />}
          title={t('plus_pellicule_title')}
          description={t('plus_pellicule_desc')}
        />
        <MenuCard
          onClick={() => setSubmenu('organisateur')}
          icon={<ChartIcon />}
          title={t('plus_organisateur_title')}
          description={t('plus_organisateur_desc')}
        />
        <MenuCard
          onClick={() => setSubmenu('about')}
          icon={<InfoIcon />}
          title={t('plus_about_title')}
          description={t('plus_about_desc')}
        />
      </>
    );
  }

  // Paris submenu
  if (submenu === 'paris') {
    const sitesBtnBg = !parisSegVenues ? '#fff' : 'transparent';
    const sitesBtnFg = !parisSegVenues ? '#0E1B38' : 'rgba(18,23,42,0.5)';
    const venuesBtnBg = parisSegVenues ? '#fff' : 'transparent';
    const venuesBtnFg = parisSegVenues ? '#0E1B38' : 'rgba(18,23,42,0.5)';

    return (
      <>
        <div style={{
          display: 'flex',
          background: 'rgba(18,23,42,0.06)',
          borderRadius: '100px',
          padding: '4px',
          marginBottom: '18px'
        }}>
          <div onClick={() => setParisSegVenues(false)} style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px 4px',
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            background: sitesBtnBg,
            color: sitesBtnFg
          }}>{t('paris_seg_sites')}</div>
          <div onClick={() => setParisSegVenues(true)} style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px 4px',
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            background: venuesBtnBg,
            color: venuesBtnFg
          }}>{t('paris_seg_venues')}</div>
        </div>

        {!parisSegVenues && (
          <>
            <div style={{
              background: '#0E1B38',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <div style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#F2E94E',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>{t('paris_transport_title')}</div>
              <div style={{
                fontSize: '12.5px',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: '1.5'
              }}>{content.paris.transport.line1[lang]}</div>
              <div style={{
                fontSize: '12.5px',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: '1.5',
                marginTop: '6px'
              }}>{content.paris.transport.line2[lang]}</div>
              <div style={{
                fontSize: '12.5px',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: '1.5',
                marginTop: '6px'
              }}>{content.paris.transport.line3[lang]}</div>
            </div>

            {LANDMARKS.map(landmark => {
              const name = lang === 'fr' ? landmark.nameFr : landmark.nameEn;
              const desc = lang === 'fr' ? landmark.descFr : landmark.descEn;

              return (
                <div key={landmark.id} style={{
                  background: '#fff',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '1px solid rgba(18,23,42,0.06)',
                  marginBottom: '14px'
                }}>
                  <div style={{
                    width: '100%',
                    height: '130px',
                    background: 'linear-gradient(135deg, #0E1B38 0%, #2FBF8F 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    Photo à venir
                  </div>
                  <div style={{ padding: '14px' }}>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#12172A'
                    }}>{name}</div>
                    <div style={{
                      fontSize: '12.5px',
                      color: 'rgba(18,23,42,0.6)',
                      marginTop: '4px',
                      lineHeight: '1.4'
                    }}>{desc}</div>
                    <div style={{ marginTop: '12px', height: '100px' }}>
                      <MapCard
                        label={name}
                        address={desc}
                        mapQuery={landmark.mapQuery}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {parisSegVenues && (
          <>
            <div style={{ height: '112px', marginBottom: '14px' }}>
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
        )}
      </>
    );
  }

  // Audios submenu
  if (submenu === 'audios') {
    return (
      <>
        {AUDIO_TRACKS.map(track => {
          const title = lang === 'fr' ? track.titleFr : track.titleEn;
          const isCurrent = audioCurrent === track.id;
          const isPlayingThis = isCurrent && audioPlaying;

          return (
            <div key={track.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 0',
              borderBottom: '1px solid rgba(18,23,42,0.07)'
            }}>
              <div onClick={() => toggleTrack(track.id)} style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#0E1B38',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
                cursor: 'pointer'
              }}>
                {isPlayingThis ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
                    <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                    <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
                    <polygon points="6 3 20 12 6 21 6 3"></polygon>
                  </svg>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#12172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{title}</div>
                <div style={{
                  fontSize: '11.5px',
                  color: 'rgba(18,23,42,0.55)',
                  marginTop: '2px'
                }}>{track.duration}</div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  // Pellicule submenu
  if (submenu === 'pellicule') {
    return <PelliculeTab t={t} showToast={showToast} />;
  }

  // Organisateur submenu
  if (submenu === 'organisateur') {
    const pendingCount = pastorQueue.filter(q => q.status === 'pending').length;
    const assignedCount = pastorQueue.filter(q => q.status === 'assigned').length;

    // Valeurs réelles si le serveur est disponible, sinon valeurs d'exemple
    const s = adminStats;
    const kpiInscrits = s ? String(s.registered) : '342';
    const kpiCheckins = s ? String(s.checkins) : '298';
    const kpiTaux = s ? `${s.attendanceRate}%` : '87%';
    const kpiRecues = s ? String(s.received) : String(pendingCount + assignedCount);
    const kpiTraitees = s ? String(s.handled) : String(assignedCount);
    const kpiActifs = s ? String(s.active) : '156';

    const countryBars = s && s.byCountry?.length
      ? s.byCountry.map((c, i) => (
          <CountryBar key={c.country} name={c.country} pct={String(c.pct)} isLast={i === s.byCountry.length - 1} />
        ))
      : [
          <CountryBar key="fr" name="France" pct="45" />,
          <CountryBar key="cg" name="Congo-Brazzaville" pct="22" />,
          <CountryBar key="cd" name="RDC" pct="18" />,
          <CountryBar key="cm" name="Cameroun" pct="8" />,
          <CountryBar key="ci" name="Côte d'Ivoire" pct="5" />,
          <CountryBar key="other" name="Autres" pct="2" isLast />,
        ];

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <KPICard value={kpiInscrits} label={t('organisateur_kpi_inscrits')} color="#0E1B38" />
          <KPICard value={kpiCheckins} label={t('organisateur_kpi_checkins')} color="#0E1B38" />
          <KPICard value={kpiTaux} label={t('organisateur_kpi_taux')} color="#2FBF8F" />
          <KPICard value={kpiRecues} label={t('organisateur_kpi_recues')} color="#EA4630" />
          <KPICard value={kpiTraitees} label={t('organisateur_kpi_traitees')} color="#0E1B38" />
          <KPICard value={kpiActifs} label={t('organisateur_kpi_actifs')} color="#0E1B38" />
        </div>

        <div style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '16px',
          color: '#12172A',
          textTransform: 'uppercase',
          marginTop: '22px',
          marginBottom: '12px'
        }}>{t('organisateur_repartition_title')}</div>

        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(18,23,42,0.06)'
        }}>
          {countryBars}
        </div>

        <div style={{
          fontSize: '11.5px',
          color: 'rgba(18,23,42,0.45)',
          marginTop: '14px',
          lineHeight: '1.5',
          textAlign: 'center'
        }}>{t('organisateur_note')}</div>
      </>
    );
  }

  // About submenu
  if (submenu === 'about') {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '11px',
            background: '#fff',
            borderRadius: '100px',
            padding: '9px 18px 9px 10px',
            boxShadow: '0 4px 14px rgba(14,27,56,0.12)'
          }}>
            <img src="/uploads/logo_lwmfd.png" alt="Life Word Mission France & Diaspora" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
            <div style={{ width: '1px', height: '26px', background: 'rgba(18,23,42,0.15)' }}></div>
            <img src="/uploads/img7-removebg-preview.png" alt="Convention Internationale Paris 2026" style={{ height: '28px', objectFit: 'contain' }} />
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#0E1B38',
            marginTop: '12px',
            textAlign: 'center'
          }}>Life Word Mission France & Diaspora</div>
        </div>

        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          color: '#EA4630'
        }}>CONVENTION PARIS 2026</div>

        <div style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '23px',
          color: '#12172A',
          textTransform: 'uppercase',
          marginTop: '4px',
          lineHeight: '1.1'
        }}>Né mort, mourir vivant</div>

        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '16px',
          marginTop: '16px',
          border: '1px solid rgba(18,23,42,0.06)'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(18,23,42,0.45)',
              textTransform: 'uppercase'
            }}>{t('about_dates_label')}</div>
            <div style={{
              fontSize: '14px',
              color: '#12172A',
              marginTop: '3px',
              fontWeight: 600
            }}>{lang === 'fr' ? about.datesFr : about.datesEn}</div>
          </div>

          <div style={{
            marginTop: '12px',
            fontSize: '12.5px',
            color: 'rgba(18,23,42,0.65)',
            lineHeight: '1.5'
          }}>{lang === 'fr' ? about.conventionFr : about.conventionEn}</div>

          <div style={{
            marginTop: '6px',
            fontSize: '12.5px',
            color: 'rgba(18,23,42,0.65)',
            lineHeight: '1.5'
          }}>{lang === 'fr' ? about.formationFr : about.formationEn}</div>

          <div style={{
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(18,23,42,0.07)'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(18,23,42,0.45)',
              textTransform: 'uppercase'
            }}>{t('about_org_label')}</div>
            <div style={{
              fontSize: '14px',
              color: '#12172A',
              marginTop: '3px',
              fontWeight: 600
            }}>Life Word Mission France & Diaspora</div>
          </div>

          <div style={{
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(18,23,42,0.07)'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(18,23,42,0.45)',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>{t('about_contact_label')}</div>
            <a href={`tel:${about.phone.replace(/\s/g, '')}`} style={{
              display: 'block',
              fontSize: '14px',
              color: '#EA4630',
              textDecoration: 'none',
              fontWeight: 600
            }}>{about.phone}</a>
            <a href={`mailto:${about.email}`} style={{
              display: 'block',
              fontSize: '14px',
              color: '#EA4630',
              textDecoration: 'none',
              fontWeight: 600,
              marginTop: '4px'
            }}>{about.email}</a>
          </div>
        </div>

        <a href="/privacy.html" target="_blank" rel="noopener" style={{
          display: 'block',
          textAlign: 'center',
          marginTop: '18px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'rgba(18,23,42,0.55)',
          textDecoration: 'underline'
        }}>{t('about_privacy_link')}</a>
      </>
    );
  }

  return null;
}

function MenuCard({ onClick, icon, title, description }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      background: '#fff',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid rgba(18,23,42,0.06)',
      cursor: 'pointer'
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: '#0E1B38',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14.5px',
          fontWeight: 700,
          color: '#12172A'
        }}>{title}</div>
        <div style={{
          fontSize: '12px',
          color: 'rgba(18,23,42,0.55)',
          marginTop: '2px'
        }}>{description}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(18,23,42,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6l6 6-6 6"></path>
      </svg>
    </div>
  );
}

function KPICard({ value, label, color }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '14px',
      border: '1px solid rgba(18,23,42,0.06)'
    }}>
      <div style={{
        fontFamily: "'Anton', sans-serif",
        fontSize: '25px',
        color
      }}>{value}</div>
      <div style={{
        fontSize: '11px',
        color: 'rgba(18,23,42,0.55)',
        marginTop: '4px',
        lineHeight: '1.3'
      }}>{label}</div>
    </div>
  );
}

function CountryBar({ name, pct, isLast = false }) {
  return (
    <div style={{ marginBottom: isLast ? 0 : '12px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12.5px',
        marginBottom: '4px'
      }}>
        <span style={{
          color: '#12172A',
          fontWeight: 600
        }}>{name}</span>
        <span style={{
          color: 'rgba(18,23,42,0.5)'
        }}>{pct}%</span>
      </div>
      <div style={{
        height: '8px',
        background: 'rgba(18,23,42,0.07)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          background: '#2FBF8F',
          width: `${pct}%`
        }}></div>
      </div>
    </div>
  );
}

function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3"></rect>
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8"></path>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"></path>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="11"></line>
      <circle cx="12" cy="8" r="0.6" fill="#fff"></circle>
    </svg>
  );
}
