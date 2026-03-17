/**
 * 노선번호 패턴으로 기후동행카드 사용 가능 여부 판단
 * - 한글 포함      → 마을버스 ❌
 * - M/G/A 시작    → 광역·경기버스 ❌
 * - N + 숫자       → 심야버스 ✅
 * - 숫자만         → 간선·지선·순환버스 ✅
 */
export function isClimateEligibleByRouteNo(routeNo) {
  if (!routeNo) return false;
  const no = String(routeNo).trim();
  if (/[가-힣]/.test(no)) return false;
  if (/^[MGA]/i.test(no)) return false;
  if (/^N\d+$/i.test(no)) return true;
  if (/^\d+$/.test(no)) return true;
  return false;
}

// 지하철 기후동행카드 적용 노선 코드 (서울시 공식 고시 기준)
// 제외: 신분당선(11), GTX
const CLIMATE_SUBWAY_CODES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101, 104, 109, 110]);

/**
 * ODsay subPath 하나가 기후동행카드로 이용 가능한지 판단
 */
function isSubPathClimate(subPath) {
  const { trafficType, lane = [] } = subPath;
  if (trafficType === 3) return true; // 도보
  if (trafficType === 1) {
    return lane.some((l) => CLIMATE_SUBWAY_CODES.has(l.subwayCode));
  }
  if (trafficType === 2) {
    return lane.some((l) => isClimateEligibleByRouteNo(l.busNo));
  }
  return false;
}

export function isPathFullyClimate(subPaths) {
  const transits = subPaths.filter((p) => p.trafficType !== 3);
  if (transits.length === 0) return false;
  return transits.every(isSubPathClimate);
}

export function getSubPathClimateFlags(subPaths) {
  return subPaths.map((p) => ({
    ...p,
    climateEligible: isSubPathClimate(p),
  }));
}
