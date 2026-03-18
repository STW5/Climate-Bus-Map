import { removeFavorite } from '../utils/favorites';

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

export default function FavoritesPanel({ favorites, onStationSelect, onFavoriteChange }) {
  if (favorites.length === 0) return null;

  const handleRemove = (e, stationId) => {
    e.stopPropagation();
    removeFavorite(stationId);
    onFavoriteChange?.();
  };

  return (
    <div className="climate-routes-panel">
      <div className="panel-section-title">
        <StarIcon />
        즐겨찾기 정류장
      </div>
      <div className="climate-routes-list">
        {favorites.map((station) => (
          <div
            key={station.stationId}
            className="climate-route-item"
            onClick={() => onStationSelect(station)}
          >
            <span className="climate-route-name">{station.stationName}</span>
            <button
              className="favorite-remove-btn"
              onClick={(e) => handleRemove(e, station.stationId)}
              aria-label="즐겨찾기 해제"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
