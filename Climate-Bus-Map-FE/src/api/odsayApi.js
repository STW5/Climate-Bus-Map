const ODSAY_BASE = 'https://api.odsay.com/v1/api';
const API_KEY = import.meta.env.VITE_ODSAY_API_KEY;

/**
 * ODsay 대중교통 경로 탐색
 * @param {{ lat: number, lng: number }} start
 * @param {{ lat: number, lng: number }} end
 * @returns {Promise<object[]>} path 배열 (info.mapObj 포함)
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

  console.log('[search] path[0].info', json.result.path[0]?.info);
  return json.result.path;
}

/**
 * ODsay loadLane — 실제 도로/철도 형상 좌표 조회
 * @param {string} mapObj - path.info.mapObj (searchTransitRoute 응답에서 직접 가져옴)
 * @param {object[]} subPaths - climateChecker로 태깅된 subPath 배열
 * @returns {Promise<object[]>} graphPos 좌표가 추가된 subPaths
 */
export async function loadLaneForPath(mapObj, subPaths) {
  console.log('[loadLane] mapObj', mapObj);
  if (!mapObj) return subPaths;

  try {
    const url = `${ODSAY_BASE}/loadLane?mapObject=0:0@${mapObj}&apiKey=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url);
    if (!res.ok) return subPaths;
    const json = await res.json();
    if (json.error || !json.result?.lane?.length) { console.warn('[loadLane] no lane', JSON.stringify(json)); return subPaths; }

    const lanes = json.result.lane;
    let laneIdx = 0;
    return subPaths.map((sp) => {
      if (sp.trafficType === 3) return sp;
      const lane = lanes[laneIdx++];
      if (!lane) return sp;
      const graphPos = lane.section?.flatMap((sec) => sec.graphPos ?? []) ?? [];
      console.log('[loadLane] graphPos', graphPos.length, 'points for trafficType', sp.trafficType);
      return { ...sp, graphPos };
    });
  } catch {
    return subPaths;
  }
}
