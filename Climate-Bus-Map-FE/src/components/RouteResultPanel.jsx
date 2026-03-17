import { isPathFullyClimate, getSubPathClimateFlags } from '../utils/climateChecker';

const TRAFFIC_ICON = { 1: '🚇', 2: '🚌', 3: '🚶' };
const TRAFFIC_LABEL = { 1: '지하철', 2: '버스', 3: '도보' };

function RouteCard({ path, climateRouteIds, onClick, selected }) {
  const subPaths = path.subPath ?? [];
  const fullyClimate = isPathFullyClimate(subPaths, climateRouteIds);
  const flagged = getSubPathClimateFlags(subPaths, climateRouteIds);
  const mins = path.info?.totalTime ?? '?';

  return (
    <div
      className={`route-card${selected ? ' route-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="route-card__header">
        <span className="route-card__time">{mins}분</span>
        {fullyClimate ? (
          <span className="climate-badge eligible">기후동행 100%</span>
        ) : (
          <span className="climate-badge ineligible">일부 불가</span>
        )}
      </div>
      <div className="route-card__segments">
        {flagged.filter((p) => p.trafficType !== 3 || flagged.filter(x => x.trafficType === 3).length <= 1).map((p, i) => {
          const name = p.trafficType === 2
            ? (p.lane?.[0]?.busNo ?? '버스')
            : p.trafficType === 1
            ? (p.lane?.[0]?.subwayCode ? `${p.lane[0].subwayCode}호선` : '지하철')
            : '도보';
          return (
            <span key={i} className={`route-segment${p.climateEligible ? '' : ' route-segment--ineligible'}`}>
              {TRAFFIC_ICON[p.trafficType]} {name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function RouteResultPanel({ paths, climateRouteIds, onSelectPath, selectedPath, onClose }) {
  if (!paths || paths.length === 0) return null;

  return (
    <div className="route-result-panel">
      <div className="route-result-header">
        <span className="route-result-title">탐색 결과 ({paths.length}개)</span>
        <button className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
      </div>
      <div className="route-result-list">
        {paths.map((path, i) => (
          <RouteCard
            key={i}
            path={path}
            climateRouteIds={climateRouteIds}
            onClick={() => onSelectPath(path)}
            selected={selectedPath === path}
          />
        ))}
      </div>
    </div>
  );
}
