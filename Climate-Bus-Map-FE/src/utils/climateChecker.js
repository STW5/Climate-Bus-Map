/**
 * 기후동행카드 버스 이용 가능 여부 판단
 *
 * 공식 기준 (서울시): "서울시 면허 시내·마을·심야버스 사용 가능, 광역·공항·타지역 면허 버스 제외"
 *
 * 판단 순서:
 *   1차) ODsay lane[].type 코드 — 가장 정확
 *   2차) 노선번호 패턴 — type 불확실 시 fallback
 */

// ODsay 버스 타입 코드 (searchPubTransPathT lane[].type)
// 명확 제외: 광역(14), 공항(5), 직행좌석/경기(4), 간선급행/M버스(6), 외곽(10)
const INELIGIBLE_BUS_TYPES = new Set([4, 5, 6, 10, 14]);
// 명확 포함: 마을(3), 간선(11), 순환(13)
const ELIGIBLE_BUS_TYPES = new Set([3, 11, 13]);

/**
 * 노선번호 패턴 fallback
 * - M/G/A 시작 → 광역·경기·공항버스 ❌
 * - 9xxx       → 광역버스 ❌
 * - N+숫자     → 심야버스 ✅
 * - 한글 포함  → 마을버스 ✅
 * - 숫자만     → 간선·지선·순환 ✅
 */
export function isClimateEligibleByRouteNo(routeNo) {
  if (!routeNo) return false;
  const no = String(routeNo).trim();
  if (/^[MGA]/i.test(no)) return false;
  if (/^9\d+$/.test(no)) return false;
  if (/^N\d+$/i.test(no)) return true;
  if (/[가-힣]/.test(no)) return true;
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
    return lane.some((l) => {
      // 1차: ODsay type 코드
      if (INELIGIBLE_BUS_TYPES.has(l.type)) return false;
      if (ELIGIBLE_BUS_TYPES.has(l.type)) return true;
      // 2차: 노선번호 패턴 fallback
      return isClimateEligibleByRouteNo(l.busNo);
    });
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
