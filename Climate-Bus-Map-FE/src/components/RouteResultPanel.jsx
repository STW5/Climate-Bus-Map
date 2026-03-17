import { useEffect, useRef } from 'react';
import { isPathFullyClimate, getSubPathClimateFlags, isClimateEligibleByRouteNo } from '../utils/climateChecker';

const SUBWAY_NAMES = {
  1:'1호선',2:'2호선',3:'3호선',4:'4호선',5:'5호선',
  6:'6호선',7:'7호선',8:'8호선',9:'9호선',
  100:'경의중앙선',101:'공항철도',104:'경춘선',109:'수인분당선',110:'우이신설선'
};

function segmentColor(subPath) {
  if (subPath.trafficType === 3) return 'var(--walk-color)';
  if (!subPath.climateEligible) return '#d32f2f';
  if (subPath.trafficType === 1) return 'var(--blue-primary)';
  return 'var(--green-primary)';
}

function SegmentBar({ subPaths, totalTime }) {
  const barRef = useRef(null);

  useEffect(() => {
    if (!barRef.current) return;
    const segments = barRef.current.querySelectorAll('.seg-bar__item');
    segments.forEach((el) => {
      el.style.width = '0';
      requestAnimationFrame(() => {
        el.style.width = el.dataset.width;
      });
    });
  }, []);

  return (
    <div className="seg-bar" ref={barRef}>
      {subPaths.map((p, i) => {
        const pct = totalTime > 0 ? ((p.sectionTime ?? 1) / totalTime) * 100 : 0;
        return (
          <div
            key={i}
            className="seg-bar__item"
            data-width={`${Math.max(pct, 3)}%`}
            style={{ background: segmentColor(p), transition: 'width 0.5s ease' }}
          />
        );
      })}
    </div>
  );
}

function SegmentRow({ subPath }) {
  const { trafficType, sectionTime, stationCount, lane = [], distance } = subPath;

  if (trafficType === 3) {
    const distText = distance >= 1000
      ? `${(distance / 1000).toFixed(1)}km`
      : `${distance ?? 0}m`;
    return (
      <div className="seg-row seg-row--walk">
        <span className="seg-row__icon">🚶</span>
        <span className="seg-row__label">도보 {sectionTime}분</span>
        <span className="seg-row__meta">{distText}</span>
      </div>
    );
  }

  const isSubway = trafficType === 1;
  const name = isSubway
    ? (SUBWAY_NAMES[lane[0]?.subwayCode] ?? '지하철')
    : (lane[0]?.busNo ?? '버스');
  const eligible = subPath.climateEligible;

  return (
    <div className={`seg-row${eligible ? '' : ' seg-row--ineligible'}`}>
      <span className="seg-row__icon">{isSubway ? '🚇' : '🚌'}</span>
      <span
        className="seg-row__badge"
        style={{ background: eligible ? (isSubway ? 'var(--blue-light)' : 'var(--green-light)') : 'var(--red-light)',
                 color: eligible ? (isSubway ? 'var(--blue-primary)' : 'var(--green-primary)') : '#c62828' }}
      >
        {name}
      </span>
      <span className="seg-row__time">{sectionTime}분</span>
      {stationCount > 0 && (
        <span className="seg-row__meta">{stationCount}정류장</span>
      )}
      {!eligible && <span className="seg-row__warn">기후동행 불가</span>}
    </div>
  );
}

function RouteCard({ path, onClick, selected }) {
  const subPaths = getSubPathClimateFlags(path.subPath ?? []);
  const fullyClimate = isPathFullyClimate(path.subPath ?? []);
  const totalTime = path.info?.totalTime ?? 0;
  const totalWalk = path.info?.totalWalk ?? 0;

  return (
    <div
      className={`route-card${selected ? ' route-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="route-card__header">
        <span className="route-card__time">{totalTime}분</span>
        <div className="route-card__badges">
          {totalWalk > 0 && (
            <span className="route-card__walk">도보 {totalWalk >= 1000 ? `${(totalWalk/1000).toFixed(1)}km` : `${totalWalk}m`}</span>
          )}
          <span className={`climate-badge ${fullyClimate ? 'eligible' : 'ineligible'}`}>
            {fullyClimate ? '기후동행 100%' : '일부 불가'}
          </span>
        </div>
      </div>

      <SegmentBar subPaths={subPaths} totalTime={totalTime} />

      <div className="route-card__segments">
        {subPaths.map((p, i) => (
          <SegmentRow key={i} subPath={p} />
        ))}
      </div>
    </div>
  );
}

export default function RouteResultPanel({ paths, onSelectPath, selectedPath, onClose }) {
  if (!paths || paths.length === 0) return null;

  return (
    <div className="route-result-panel route-result-panel--animate">
      <div className="route-result-header">
        <span className="route-result-title">경로 {paths.length}개</span>
        <button className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
      </div>
      <div className="route-result-list">
        {paths.map((path, i) => (
          <RouteCard
            key={i}
            path={path}
            onClick={() => onSelectPath(path)}
            selected={selectedPath === path}
          />
        ))}
      </div>
    </div>
  );
}
