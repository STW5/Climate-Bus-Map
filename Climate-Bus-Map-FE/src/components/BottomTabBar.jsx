const TABS = [
  {
    id: 'nearby',
    label: '주변',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/>
        <circle cx="12" cy="11" r="3"/>
      </svg>
    ),
  },
  {
    id: 'route',
    label: '경로',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="6" r="2"/>
        <path d="M5 8v3a2 2 0 002 2h10a2 2 0 012 2v1"/>
        <circle cx="19" cy="18" r="2"/>
      </svg>
    ),
  },
  {
    id: 'favorites',
    label: '즐겨찾기',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    id: 'saved',
    label: '저장경로',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
    ),
  },
];

export default function BottomTabBar({ activeTab, onTabChange, hidden }) {
  return (
    <nav className={`bottom-tab-bar${hidden ? ' bottom-tab-bar--hidden' : ''}`}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`tab-item${isActive ? ' tab-item--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-pressed={isActive}
          >
            {tab.icon(isActive)}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
