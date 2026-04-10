import { useState, useEffect } from 'react';
import { fetchSavedRoutes, fetchSavedRouteDetail, deleteSavedRoute } from '../api/savedRoutesApi';

function RouteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="2"/><path d="M5 8v3a2 2 0 002 2h10a2 2 0 012 2v1"/><circle cx="19" cy="18" r="2"/>
    </svg>
  );
}

export default function SavedRoutesPanel({ onRouteRestore }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedRoutes().then(setRoutes).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteSavedRoute(id);
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRestore = async (id) => {
    try {
      const detail = await fetchSavedRouteDetail(id);
      onRouteRestore?.(detail);
    } catch {
      alert('경로를 불러오지 못했습니다.');
    }
  };

  if (loading) return <div className="climate-routes-panel"><p className="favorites-empty">불러오는 중...</p></div>;

  return (
    <div className="climate-routes-panel">
      <div className="panel-section-title">
        <RouteIcon />
        저장된 경로
        <span className="saved-routes-count">{routes.length}/10</span>
      </div>

      {routes.length === 0 ? (
        <p className="favorites-empty">저장된 경로가 없습니다.<br/>경로 탐색 후 저장해 보세요.</p>
      ) : (
        <div className="climate-routes-list">
          {routes.map((route) => (
            <div key={route.id} className="climate-route-item saved-route-item" onClick={() => handleRestore(route.id)}>
              <div className="saved-route-info">
                <span className="saved-route-name">{route.name}</span>
                <span className="saved-route-detail">{route.startName} → {route.endName}</span>
              </div>
              <button
                className="favorite-remove-btn"
                onClick={(e) => handleDelete(e, route.id)}
                aria-label="삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
