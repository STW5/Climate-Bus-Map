import ClimateBadge from './ClimateBadge';
import { secToMin } from '../utils/format';

export default function ArrivalPanel({ station, arrivals, loading, error, onClose }) {
  if (!station) return null;

  return (
    <div className="arrival-panel">
      <div className="panel-header">
        <h2>{station.stationName}</h2>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="panel-body">
        {loading && <p className="status-msg">불러오는 중...</p>}
        {error && <p className="status-msg error">{error}</p>}
        {!loading && !error && arrivals.length === 0 && (
          <p className="status-msg">도착 예정 버스가 없습니다.</p>
        )}
        {!loading && !error && arrivals.map((arrival) => (
          <div key={arrival.routeId} className="arrival-item">
            <div className="route-info">
              <span className="route-no">{arrival.routeNo}번</span>
              <div className="arrival-times">
                <span>{secToMin(arrival.arrivalSec1)}</span>
                {arrival.arrivalSec2 > 0 && (
                  <span className="second-arrival"> / {secToMin(arrival.arrivalSec2)}</span>
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
