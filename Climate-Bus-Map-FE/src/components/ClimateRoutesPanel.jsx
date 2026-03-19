export default function ClimateRoutesPanel({ routes, loading, error, apiLimitExceeded }) {
  if (!loading && apiLimitExceeded) {
    return (
      <div className="climate-panel">
        <div className="climate-panel__header">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/>
          </svg>
          <span className="climate-panel__title">주변 기후동행 노선</span>
        </div>
        <p className="climate-panel__limit-msg">
          오늘 버스 정보 조회 한도에 도달했습니다.<br />내일 자정에 초기화됩니다.
        </p>
      </div>
    );
  }
  if (error || (!loading && (!routes || routes.length === 0))) return null;

  return (
    <div className="climate-panel">
      <div className="climate-panel__header">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/>
        </svg>
        <span className="climate-panel__title">주변 기후동행 노선</span>
      </div>
      {loading ? (
        <div className="climate-panel__skeletons">
          {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 24, borderRadius: 6 }} />)}
        </div>
      ) : (
        <ul className="climate-panel__list">
          {routes.map((route) => (
            <li key={route.routeId} className="climate-panel__item">
              <span className="climate-panel__dot" />
              <span className="climate-panel__route-no">{route.routeNo}</span>
              {route.routeType && <span className="climate-panel__route-type">{route.routeType}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
