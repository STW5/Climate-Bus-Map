export default function ClimateRoutesPanel({ routes, loading, error }) {
  if (loading) {
    return (
      <div className="climate-panel">
        <div className="climate-panel__title">내 주변 기후동행 노선</div>
        <div className="climate-panel__loading">조회 중...</div>
      </div>
    );
  }

  if (error || !routes || routes.length === 0) return null;

  return (
    <div className="climate-panel">
      <div className="climate-panel__title">내 주변 기후동행 노선</div>
      <ul className="climate-panel__list">
        {routes.map((route) => (
          <li key={route.routeId} className="climate-panel__item">
            <span className="climate-panel__badge">🟢</span>
            <span className="climate-panel__route-no">{route.routeNo}</span>
            <span className="climate-panel__route-type">{route.routeType}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
