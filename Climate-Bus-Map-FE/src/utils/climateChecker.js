// 지하철 기후동행카드 적용 노선 코드 (서울시 공식 고시 기준)
// 제외: 신분당선(11), GTX
const CLIMATE_SUBWAY_CODES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101, 104, 109, 110]);

/**
 * ODsay subPath 하나가 기후동행카드로 이용 가능한지 판단
 * @param {object} subPath - ODsay subPath 객체
 * @param {Set<string>} climateRouteIds - BE에서 가져온 버스 route_id Set
 */
function isSubPathClimate(subPath, climateRouteIds) {
  const { trafficType, lane = [] } = subPath;
  if (trafficType === 3) return true; // 도보는 무조건 통과
  if (trafficType === 1) {
    // 지하철: subwayCode 화이트리스트 확인
    return lane.some((l) => CLIMATE_SUBWAY_CODES.has(l.subwayCode));
  }
  if (trafficType === 2) {
    // 버스: busID가 DB climate-eligible 목록에 있는지 확인
    return lane.some((l) => climateRouteIds.has(String(l.busID)));
  }
  return false;
}

/**
 * ODsay 경로(path) 전체가 기후동행카드로 100% 이용 가능한지 판단
 */
export function isPathFullyClimate(subPaths, climateRouteIds) {
  const transits = subPaths.filter((p) => p.trafficType !== 3);
  if (transits.length === 0) return false;
  return transits.every((p) => isSubPathClimate(p, climateRouteIds));
}

/**
 * 경로 내 각 구간의 기후동행 여부를 배열로 반환
 */
export function getSubPathClimateFlags(subPaths, climateRouteIds) {
  return subPaths.map((p) => ({
    ...p,
    climateEligible: isSubPathClimate(p, climateRouteIds),
  }));
}
