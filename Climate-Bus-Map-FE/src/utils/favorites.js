const KEY = 'climatego_favorites';
const MAX = 10;

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function addFavorite(station) {
  const list = getFavorites().filter((s) => s.stationId !== station.stationId);
  list.unshift(station);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function removeFavorite(stationId) {
  const list = getFavorites().filter((s) => s.stationId !== stationId);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function isFavorite(stationId) {
  return getFavorites().some((s) => s.stationId === stationId);
}
