const KEY = 'climatego_recent_searches';
const MAX = 5;

export function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function addRecentSearch(item) {
  const list = getRecentSearches().filter((s) => s.name !== item.name);
  list.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function removeRecentSearch(name) {
  const list = getRecentSearches().filter((s) => s.name !== name);
  localStorage.setItem(KEY, JSON.stringify(list));
}
