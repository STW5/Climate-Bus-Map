import { useState, useEffect } from 'react';
import { isPathFullyClimate } from '../utils/climateChecker';

const SUBWAY_NAMES = {
  1:'1호선',2:'2호선',3:'3호선',4:'4호선',5:'5호선',
  6:'6호선',7:'7호선',8:'8호선',9:'9호선',
  21:'인천1호선',22:'인천2호선',
  100:'경의중앙선',101:'공항철도',102:'자기부상철도',
  104:'경춘선',107:'에버라인',108:'의정부경전철',
  109:'수인분당선',110:'우이신설선',111:'서해선',112:'신림선',113:'GTX-A',
};

function arrivalTimeStr(totalMin) {
  const d = new Date(Date.now() + totalMin * 60000);
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
  return `${h >= 12 ? '오후' : '오전'} ${h % 12 || 12}:${m}`;
}

function segColor(sp) {
  if (sp.trafficType === 3) return '#9ca3af';
  if (!sp.climateEligible) return '#ef4444';
  if (sp.trafficType === 1) return '#1a56c4';
  return '#0ea5e9';
}

function SegBar({ subPaths, totalTime }) {
  return (
    <div className="sel-seg-bar">
      {subPaths.map((p, i) => {
        const pct = totalTime > 0 ? ((p.sectionTime ?? 1) / totalTime) * 100 : 0;
        return (
          <div key={i} className="sel-seg-bar__item"
            style={{ background: segColor(p), width: `${Math.max(pct, 3)}%` }} />
        );
      })}
    </div>
  );
}

function BusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm9 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z"/></svg>;
}
function SubwayIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 2 4 2.5 4 6v9.5A2.5 2.5 0 006.5 18L5 19.5V20h14v-.5L17.5 18A2.5 2.5 0 0020 15.5V6c0-3.5-4-4-8-4zm-3.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm7 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 6h12v5H6V6z"/></svg>;
}
function WalkIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5a2 2 0 100-4 2 2 0 000 4zm-3.19 5.86l-1.8 9.64h2.05l1.1-5.38 2.34 2.38v5h2v-6.5l-2.35-2.38.73-3.62A7.3 7.3 0 0019 13v-2a5.28 5.28 0 01-4.22-2.11l-1-1.5a2 2 0 00-1.64-.89c-.24 0-.49.05-.72.14L6 9v4h2V10.3l2.31-.94z"/></svg>;
}

function clockStr(offsetMin) {
  const d = new Date(Date.now() + offsetMin * 60000);
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function ArrivalChip({ boardingTime }) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!boardingTime) return;
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [boardingTime]);

  if (!boardingTime) return null;

  const elapsed = (Date.now() - (boardingTime.fetchedAt ?? Date.now())) / 1000;
  const remaining = boardingTime.arrivalSec - elapsed;
  const min = Math.floor(remaining / 60);
  const sec = Math.floor(remaining % 60);
  const label = remaining <= 0 ? '곧 도착' : min > 0 ? `${min}분 ${sec}초 후` : `${sec}초 후`;
  const urgent = remaining <= 120;

  return (
    <span className={`boarding-chip${urgent ? ' boarding-chip--urgent' : ''}`}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
      {label}
    </span>
  );
}

function SegmentDetail({ subPath, startMin, boardingTime }) {
  const { trafficType, sectionTime, stationCount, distance, lane = [], passStopList, climateEligible } = subPath;
  const stations = passStopList?.stations ?? [];
  const fromStation = stations[0]?.stationName;
  const toStation = stations[stations.length - 1]?.stationName;
  const endMin = startMin + (sectionTime ?? 0);

  if (trafficType === 3) {
    const dist = distance >= 1000 ? `${(distance/1000).toFixed(1)}km` : `${distance ?? 0}m`;
    return (
      <div className="sel-seg sel-seg--walk">
        <div className="sel-seg__icon sel-seg__icon--walk"><WalkIcon /></div>
        <div className="sel-seg__body">
          <span className="sel-seg__time-label">{clockStr(startMin)}</span>
          <span className="sel-seg__label">도보 이동</span>
          <span className="sel-seg__meta">{sectionTime}분 · {dist}</span>
        </div>
      </div>
    );
  }

  const isSubway = trafficType === 1;
  const routeName = isSubway
    ? (lane[0]?.name ?? SUBWAY_NAMES[lane[0]?.subwayCode] ?? '지하철')
    : (lane[0]?.busNo ?? '버스');
  const color = segColor({ trafficType, climateEligible });

  return (
    <div className="sel-seg">
      <div className="sel-seg__timeline">
        <div className="sel-seg__icon" style={{ background: `${color}20`, color }}>
          {isSubway ? <SubwayIcon /> : <BusIcon />}
        </div>
        <div className="sel-seg__line" style={{ background: color }} />
      </div>
      <div className="sel-seg__body">
        <div className="sel-seg__time-range">
          <span className="sel-seg__time-label">{clockStr(startMin)}</span>
          <span className="sel-seg__time-arrow">→</span>
          <span className="sel-seg__time-label">{clockStr(endMin)}</span>
        </div>
        <div className="sel-seg__header">
          <span className="sel-seg__badge" style={{ background: `${color}18`, color }}>{routeName}</span>
          <span className="sel-seg__time">{sectionTime}분</span>
          <ArrivalChip boardingTime={boardingTime} />
          {!climateEligible && <span className="sel-seg__ineligible">기후동행 불가</span>}
        </div>
        {fromStation && (
          <div className="sel-seg__stations">
            <span>{fromStation}</span>
            {toStation && fromStation !== toStation && (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <span>{toStation}</span>
              </>
            )}
          </div>
        )}
        {stationCount > 0 && (
          <span className="sel-seg__stops">{stationCount}정류장</span>
        )}
      </div>
    </div>
  );
}

export default function SelectedRoutePanel({ path, boardingTime, segmentBoardingTimes = [], onBack, onClose }) {
  if (!path) return null;

  const subPaths = path.subPath ?? [];
  const fullyClimate = isPathFullyClimate(subPaths);
  const totalTime = path.info?.totalTime ?? 0;

  return (
    <div className="sel-route-panel">
      {/* 헤더 */}
      <div className="sel-route-header">
        <button className="sel-back-btn" onClick={onBack} aria-label="목록으로">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          목록
        </button>
        <div className="sel-route-summary">
          <span className="sel-route-time">{totalTime}분</span>
          <span className="sel-route-arrival">{arrivalTimeStr(totalTime)} 도착</span>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
      </div>

      {/* 배지 행 */}
      <div className="sel-route-badges">
        <ArrivalChip boardingTime={boardingTime} />
        <span className={`climate-badge ${fullyClimate ? 'eligible' : 'ineligible'}`}>
          {fullyClimate ? '기후동행 100%' : '일부 불가'}
        </span>
      </div>

      {/* 구간 바 */}
      <SegBar subPaths={subPaths} totalTime={totalTime} />

      {/* 구간 상세 */}
      <div className="sel-route-segments">
        {subPaths.reduce((acc, sp, i) => {
          const startMin = i === 0 ? 0 : acc[i - 1].endMin;
          acc.push({ sp, i, startMin, endMin: startMin + (sp.sectionTime ?? 0) });
          return acc;
        }, []).map(({ sp, i, startMin }) => (
          <SegmentDetail
            key={i}
            subPath={sp}
            startMin={startMin}
            boardingTime={segmentBoardingTimes[i] ?? null}
          />
        ))}
      </div>
    </div>
  );
}
