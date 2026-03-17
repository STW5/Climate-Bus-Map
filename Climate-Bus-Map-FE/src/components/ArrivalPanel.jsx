import { useState, useEffect } from 'react';
import ClimateBadge from './ClimateBadge';

function SkeletonRow() {
  return (
    <div className="arrival-item">
      <div className="route-left">
        <div className="skeleton skeleton-badge" />
        <div className="route-times">
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text-sm" />
        </div>
      </div>
      <div className="skeleton skeleton-chip" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d0d0d0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
      <p>도착 예정 버스가 없습니다</p>
    </div>
  );
}

function ArrivalTime({ sec, fetchedAt, primary }) {
  const [remaining, setRemaining] = useState(sec);

  useEffect(() => {
    setRemaining(sec);
    if (!fetchedAt) return;
    const id = setInterval(() => {
      setRemaining(Math.max(0, sec - Math.floor((Date.now() - fetchedAt) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [sec, fetchedAt]);

  const min = Math.floor(remaining / 60);
  const s = remaining % 60;
  if (min === 0) {
    return (
      <span className={primary ? 'arrival-first' : 'arrival-second'}>
        <span className="arrival-num">곧 도착</span>
      </span>
    );
  }
  return (
    <span className={primary ? 'arrival-first' : 'arrival-second'}>
      <span className="arrival-num">{min}</span>
      <span className="arrival-unit">분 {s > 0 ? `${s}초` : ''}</span>
    </span>
  );
}

// 노선 번호로 서울 버스 유형 판별 → 배지 색상
function routeBadgeStyle(routeNo) {
  const no = String(routeNo ?? '');
  if (no.startsWith('N'))          return { background: '#283593', color: '#fff' }; // 심야
  if (/^9\d{3}/.test(no))          return { background: '#c62828', color: '#fff' }; // 광역
  if (/^[1-3]\d{2,3}/.test(no))   return { background: '#1565c0', color: '#fff' }; // 간선
  if (/^[4-7]\d{3}/.test(no))     return { background: '#2e7d32', color: '#fff' }; // 지선
  if (/^0\d|^\d{1,2}$/.test(no))  return { background: '#e65100', color: '#fff' }; // 순환
  return { background: 'var(--green-primary)', color: '#fff' };
}

export default function ArrivalPanel({ station, arrivals, loading, error, onClose }) {
  return (
    <div className={`arrival-panel${station ? ' open' : ''}`}>
      <div className="drag-handle">
        <div className="drag-handle-bar" />
      </div>

      <div className="panel-header">
        <div className="station-info">
          <h2>{station?.stationName ?? ''}</h2>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
      </div>

      <div className="divider" />

      {!loading && !error && arrivals.length > 0 && (
        <p className="arrival-count">{arrivals.length}개 노선 도착 예정</p>
      )}

      <div className="panel-body">
        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}
        {!loading && error && <p className="status-msg error">{error}</p>}
        {!loading && !error && arrivals.length === 0 && station && <EmptyState />}
        {!loading && !error && arrivals.map((arrival, i) => (
          <div key={`${arrival.routeId}-${i}`} className="arrival-item">
            <div className="route-left">
              <div className="route-badge" style={routeBadgeStyle(arrival.routeNo)}>{arrival.routeNo}</div>
              <div className="route-times">
                <ArrivalTime sec={arrival.arrivalSec1} fetchedAt={arrival.fetchedAt} primary />
                {arrival.arrivalSec2 > 0 && (
                  <ArrivalTime sec={arrival.arrivalSec2} fetchedAt={arrival.fetchedAt} />
                )}
              </div>
            </div>
            <ClimateBadge eligible={arrival.climateEligible} />
          </div>
        ))}
      </div>
    </div>
  );
}
