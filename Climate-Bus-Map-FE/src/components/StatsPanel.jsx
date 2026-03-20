import { useState, useEffect } from 'react';
import { fetchRideStats } from '../api/ridesApi';

export default function StatsPanel({ onLoginRequest, isLoggedIn }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    fetchRideStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="climate-routes-panel">
        <p className="favorites-empty">
          로그인하면 기후동행 이용 통계를 볼 수 있습니다.
          <br />
          <button className="favorites-login-hint" style={{ display: 'inline', marginTop: 8 }} onClick={onLoginRequest}>
            로그인하기
          </button>
        </p>
      </div>
    );
  }

  if (loading) return <div className="climate-routes-panel"><p className="favorites-empty">불러오는 중...</p></div>;

  const thisMonth = stats?.thisMonth ?? 0;
  const lastMonth = stats?.lastMonth ?? 0;
  const total = stats?.total ?? 0;
  const recent = stats?.recent ?? [];
  // 탑승 1회당 CO2 절감 약 0.21kg (버스 vs 자가용 기준)
  const co2 = (total * 0.21).toFixed(1);

  return (
    <div className="climate-routes-panel">
      <div className="panel-section-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
        </svg>
        기후동행 이용 통계
      </div>

      <div className="stats-cards">
        <div className="stats-card">
          <span className="stats-card__value">{thisMonth}</span>
          <span className="stats-card__label">이번 달 탑승</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__value">{lastMonth}</span>
          <span className="stats-card__label">지난 달 탑승</span>
        </div>
        <div className="stats-card stats-card--green">
          <span className="stats-card__value">{co2}kg</span>
          <span className="stats-card__label">CO₂ 절감 추정</span>
        </div>
      </div>

      {recent.length > 0 && (
        <>
          <div className="panel-section-title" style={{ marginTop: 16 }}>최근 탑승 내역</div>
          <div className="climate-routes-list">
            {recent.map((r, i) => (
              <div key={i} className="climate-route-item">
                <span className="climate-route-name">{r.routeName || '기후동행 버스'}</span>
                <span className="saved-route-detail">{r.rideDate}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {total === 0 && (
        <p className="favorites-empty" style={{ marginTop: 12 }}>
          아직 탑승 기록이 없습니다.<br />
          기후동행 버스 도착 화면에서 탑승 기록을 남겨보세요!
        </p>
      )}
    </div>
  );
}
