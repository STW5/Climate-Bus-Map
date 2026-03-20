import { useAuth } from '../context/AuthContext';
import { removeFavoriteForUser } from '../api/favoritesApi';

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

export default function FavoritesPanel({ favorites, onStationSelect, onFavoriteChange, onLoginRequest }) {
  const { isLoggedIn } = useAuth();

  const handleRemove = async (e, stationId) => {
    e.stopPropagation();
    await removeFavoriteForUser(stationId, isLoggedIn);
    onFavoriteChange?.();
  };

  return (
    <div className="climate-routes-panel">
      <div className="panel-section-title">
        <StarIcon />
        즐겨찾기 정류장
        {!isLoggedIn && (
          <button className="favorites-login-hint" onClick={onLoginRequest}>
            로그인하면 기기 간 동기화
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <p className="favorites-empty">즐겨찾기한 정류장이 없습니다.</p>
      ) : (
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
      )}
    </div>
  );
}
