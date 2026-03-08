import ClimateBadge from './ClimateBadge';
import { secToMin } from '../utils/format';

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

export default function ArrivalPanel({ station, arrivals, loading, error, onClose }) {
  return (
    <div className={`arrival-panel${station ? ' open' : ''}`}>
      <div className="drag-handle">
        <div className="drag-handle-bar" />
      </div>

      <div className="panel-header">
        <div className="station-info">
          <h2>{station?.stationName ?? ''}</h2>
          {station?.stationId && <p className="station-id">정류장 ID {station.stationId}</p>}
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
        {!loading && !error && arrivals.map((arrival) => (
          <div key={arrival.routeId} className="arrival-item">
            <div className="route-left">
              <div className="route-badge">{arrival.routeNo}</div>
              <div className="route-times">
                <span className="arrival-first">{secToMin(arrival.arrivalSec1)}</span>
                {arrival.arrivalSec2 > 0 && (
                  <span className="arrival-second">{secToMin(arrival.arrivalSec2)}</span>
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
