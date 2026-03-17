import { useEffect, useRef } from 'react';
import { isPathFullyClimate, getSubPathClimateFlags } from '../utils/climateChecker';

function BusIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z"/></svg>;
}
function SubwayIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 2 4 2.5 4 6v9.5A2.5 2.5 0 006.5 18L5 19.5V20h14v-.5L17.5 18A2.5 2.5 0 0020 15.5V6c0-3.5-4-4-8-4zm-3.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z"/></svg>;
}
function WalkIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5a2 2 0 100-4 2 2 0 000 4zm-3.19 5.86l-1.8 9.64h2.05l1.1-5.38 2.34 2.38v5h2v-6.5l-2.35-2.38.73-3.62A7.3 7.3 0 0019 13v-2a5.28 5.28 0 01-4.22-2.11l-1-1.5a2 2 0 00-1.64-.89c-.24 0-.49.05-.72.14L6 9v4h2V10.3l2.31-.94z"/></svg>;
}

function arrivalTimeStr(totalMin) {
  const d = new Date(Date.now() + totalMin * 60000);
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
  return `${h >= 12 ? '오후' : '오전'} ${h % 12 || 12}:${m} 도착`;
}

function SkeletonCard() {
  return (
    <div className="route-card" style={{ pointerEvents: 'none' }}>
      <div className="route-card__header">
        <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 20 }} />
      </div>
      <div className="skeleton" style={{ height: 6, borderRadius: 3, margin: '10px 0 14px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div className="skeleton" style={{ width: '70%', height: 16, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: '50%', height: 16, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4 }} />
      </div>
    </div>
  );
}

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
        <span className="seg-row__icon seg-row__icon--walk"><WalkIcon /></span>
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
      <span className={`seg-row__icon${isSubway ? ' seg-row__icon--subway' : ' seg-row__icon--bus'}`}>
        {isSubway ? <SubwayIcon /> : <BusIcon />}
      </span>
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

function BoardingChip({ boardingTime }) {
  if (!boardingTime) return null;
  const min = Math.floor(boardingTime.arrivalSec / 60);
  const label = min <= 0 ? '곧 도착' : `${min}분 후 탑승`;
  const urgent = min <= 2;
  return (
    <span className={`boarding-chip${urgent ? ' boarding-chip--urgent' : ''}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
      {label}
    </span>
  );
}

function RouteCard({ path, boardingTime, onClick, selected }) {
  const subPaths = getSubPathClimateFlags(path.subPath ?? []);
  const fullyClimate = isPathFullyClimate(path.subPath ?? []);
  const totalTime = path.info?.totalTime ?? 0;
  const totalWalk = path.info?.totalWalk ?? 0;
  const transferCount = subPaths.filter(p => p.trafficType !== 3).length - 1;
  const walkMin = totalWalk > 0 ? Math.ceil(totalWalk / 80) : 0;

  return (
    <div
      className={`route-card${selected ? ' route-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="route-card__header">
        <div className="route-card__times">
          <span className="route-card__time">{totalTime}분</span>
          <span className="route-card__arrival">{arrivalTimeStr(totalTime)}</span>
        </div>
        <div className="route-card__badges">
          <BoardingChip boardingTime={boardingTime} />
          <span className={`climate-badge ${fullyClimate ? 'eligible' : 'ineligible'}`}>
            {fullyClimate ? '기후동행 100%' : '일부 불가'}
          </span>
        </div>
      </div>
      <div className="route-card__meta">
        {transferCount > 0 && <span>{transferCount}회 환승</span>}
        {walkMin > 0 && <span>도보 {walkMin}분</span>}
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

export default function RouteResultPanel({ paths, loading, boardingTimes, onSelectPath, selectedPath, onClose }) {
  if (!loading && (!paths || paths.length === 0)) return null;

  return (
    <div className="route-result-panel route-result-panel--animate">
      <div className="route-result-header">
        <span className="route-result-title">
          {loading ? '경로 탐색 중...' : `경로 ${paths.length}개`}
        </span>
        <button className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
      </div>
      <div className="route-result-list">
        {loading
          ? [0, 1, 2].map(i => <SkeletonCard key={i} />)
          : paths.map((path, i) => (
            <RouteCard
              key={i}
              path={path}
              boardingTime={boardingTimes[i] ?? null}
              onClick={() => onSelectPath(path, i)}
              selected={selectedPath === path}
            />
          ))
        }
      </div>
    </div>
  );
}
