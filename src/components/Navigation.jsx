export default function Navigation({ currentTab, goHome, goProgramme, goSejour, goQuestion, goPlus, t }) {
  const tabColor = (tab) => currentTab === tab ? '#0E1B38' : 'rgba(18,23,42,0.4)';

  return (
    <div style={{
      flex: 'none',
      background: '#fff',
      borderTop: '1px solid rgba(18,23,42,0.08)',
      display: 'flex',
      padding: '8px 4px 24px',
      position: 'relative',
      zIndex: 2
    }}>
      <NavItem
        onClick={goHome}
        color={tabColor('home')}
        icon={<HomeIcon />}
        label={t('nav_home')}
      />
      <NavItem
        onClick={goProgramme}
        color={tabColor('programme')}
        icon={<CalendarIcon />}
        label={t('nav_programme')}
      />
      <NavItem
        onClick={goSejour}
        color={tabColor('sejour')}
        icon={<HotelIcon />}
        label={t('nav_sejour')}
      />
      <NavItem
        onClick={goQuestion}
        color={tabColor('question')}
        icon={<QuestionIcon />}
        label={t('nav_question')}
      />
      <NavItem
        onClick={goPlus}
        color={tabColor('plus')}
        icon={<GridIcon />}
        label={t('nav_plus')}
      />
    </div>
  );
}

function NavItem({ onClick, color, icon, label }) {
  return (
    <div onClick={onClick} style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '3px',
      cursor: 'pointer',
      color
    }}>
      {icon}
      <div style={{ fontSize: '9.5px', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8"></path>
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"></path>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"></rect>
      <path d="M16 2v4M8 2v4M3 10h18"></path>
    </svg>
  );
}

function HotelIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"></path>
      <path d="M3 18h18M3 12h18"></path>
      <path d="M7 10V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"></path>
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-9.5 8.31A8.5 8.5 0 1 1 21 11.5z"></path>
      <path d="M12 8v4M12 16h.01"></path>
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"></rect>
      <rect x="14" y="3" width="7" height="7" rx="1"></rect>
      <rect x="3" y="14" width="7" height="7" rx="1"></rect>
      <rect x="14" y="14" width="7" height="7" rx="1"></rect>
    </svg>
  );
}
