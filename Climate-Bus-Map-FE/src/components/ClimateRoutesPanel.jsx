function formatDist(position, station) {
  if (!position || !station) return '';
  const m = Math.round(Math.hypot(
    (station.lat - position.lat) * 111000,
    (station.lng - position.lng) * 88000,
  ));
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

function formatMin(sec, fetchedAt) {
  const elapsed = fetchedAt ? Math.floor((Date.now() - fetchedAt) / 1000) : 0;
  const remaining = Math.max(0, sec - elapsed);
  const min = Math.floor(remaining / 60);
  if (min === 0) return '곧 도착';
  return `${min}분`;
}

function routeBadgeStyle(routeNo) {
  const no = String(routeNo ?? '');
  if (no.startsWith('N'))         return { background: '#283593', color: '#fff' };
  if (/^9\d{3}/.test(no))        return { background: '#c62828', color: '#fff' };
  if (/^[1-3]\d{2,3}/.test(no))  return { background: '#1565c0', color: '#fff' };
  if (/^[4-7]\d{3}/.test(no))    return { background: '#2e7d32', color: '#fff' };
  if (/^0\d|^\d{1,2}$/.test(no)) return { background: '#e65100', color: '#fff' };
  return { background: '#1976d2', color: '#fff' };
}

export default function ClimateRoutesPanel({ station, arrivals, loading, position }) {
  if (!station) return null;

  const dist = formatDist(position, station);
  const visible = arrivals.filter(a => a.arrivalSec1 != null).slice(0, 3);

  return (
    <div className="climate-panel">
      <div className="climate-panel__header">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/>
        </svg>
        <span className="climate-panel__title">{station.stationName}</span>
        {dist && <span className="climate-panel__dist">{dist}</span>}
      </div>

      {loading ? (
        <div className="climate-panel__skeletons">
          {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 20, borderRadius: 6 }} />)}
        </div>
      ) : visible.length === 0 ? (
        <p className="climate-panel__empty">도착 예정 버스 없음</p>
      ) : (
        <ul className="climate-panel__list">
          {visible.map((a, i) => (
            <li key={i} className="climate-panel__item">
              <span className="climate-panel__badge" style={routeBadgeStyle(a.routeNo)}>{a.routeNo}</span>
              <span className="climate-panel__time">{formatMin(a.arrivalSec1, a.fetchedAt)}</span>
              {a.arrivalSec2 != null && (
                <span className="climate-panel__time climate-panel__time--second">
                  · {formatMin(a.arrivalSec2, a.fetchedAt)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
