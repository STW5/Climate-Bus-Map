import { addFavorite as addLocal, removeFavorite as removeLocal, getFavorites as getLocal, clearLocalFavorites } from '../utils/favorites';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const call = (method, path, body) =>
  fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => r.json());

// ── 서버 API ─────────────────────────────────────
export async function fetchServerFavorites() {
  const json = await call('GET', '/api/v1/favorites');
  return json.success ? json.data : [];
}

export async function addServerFavorite(station) {
  await call('POST', '/api/v1/favorites', {
    stationId: station.stationId,
    stationName: station.stationName,
    arsId: station.arsId ?? '',
    lat: station.lat,
    lng: station.lng,
  });
}

export async function removeServerFavorite(stationId) {
  await call('DELETE', `/api/v1/favorites/${stationId}`);
}

// 첫 로그인 시 localStorage → 서버 마이그레이션
export async function migrateLocalToServer() {
  const local = getLocal();
  if (local.length === 0) return;
  await call('POST', '/api/v1/favorites/bulk', local.map((s) => ({
    stationId: s.stationId,
    stationName: s.stationName,
    arsId: s.arsId ?? '',
    lat: s.lat,
    lng: s.lng,
  })));
  clearLocalFavorites();
}

// ── 통합 인터페이스 (App.jsx에서 isLoggedIn 여부에 따라 자동 분기) ──
export async function getFavoritesForUser(isLoggedIn) {
  if (isLoggedIn) return fetchServerFavorites();
  return getLocal();
}

export async function addFavoriteForUser(station, isLoggedIn) {
  if (isLoggedIn) return addServerFavorite(station);
  addLocal(station);
}

export async function removeFavoriteForUser(stationId, isLoggedIn) {
  if (isLoggedIn) return removeServerFavorite(stationId);
  removeLocal(stationId);
}
