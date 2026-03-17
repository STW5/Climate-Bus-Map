const ODSAY_BASE = 'https://api.odsay.com/v1/api';
const API_KEY = import.meta.env.VITE_ODSAY_API_KEY;

/**
 * ODsay 대중교통 경로 탐색
 * @param {{ lat: number, lng: number }} start
 * @param {{ lat: number, lng: number }} end
 * @returns {Promise<object[]>} path 배열
 */
export async function searchTransitRoute(start, end) {
  const params = new URLSearchParams({
    SX: start.lng,
    SY: start.lat,
    EX: end.lng,
    EY: end.lat,
    OPT: 0,        // 최적경로
    SearchType: 0, // 도시내 (서울)
    apiKey: API_KEY,
  });

  const res = await fetch(`${ODSAY_BASE}/searchPubTransPathT?${params}`);
  if (!res.ok) throw new Error(`ODsay API 오류: HTTP ${res.status}`);
  const json = await res.json();

  if (json.error) throw new Error(json.error.msg || 'ODsay 경로탐색 실패');
  if (!json.result?.path) throw new Error('경로를 찾을 수 없습니다');

  return json.result.path;
}
