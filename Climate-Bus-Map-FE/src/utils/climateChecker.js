/**
 * 기후동행카드 이용 가능 여부 판단
 *
 * 공식 기준 (서울시): https://news.seoul.go.kr/traffic/archives/510963
 * - 버스: 서울시 면허 시내·마을·심야·순환·지선·간선버스 (광역·공항·타지역 면허 제외)
 * - 지하철: 허용 노선 + 허용 구간 (신분당선·GTX 제외, 노선별 구간 제한)
 */

// ── 버스 ──────────────────────────────────────────────────────────────────
// ODsay 버스 타입 코드 (lane[].type)
const INELIGIBLE_BUS_TYPES = new Set([4, 5, 6, 10, 14]); // 광역(14), 공항(5), 직행좌석/M버스(4,6), 외곽(10)
const ELIGIBLE_BUS_TYPES   = new Set([3, 11, 12, 13]);   // 마을(3), 간선(11), 지선(12), 순환(13)

/**
 * 노선번호 패턴 fallback (busCityCode/type 없을 때)
 * - M·G·A 시작 → 광역·경기·공항 ❌
 * - 9xxx        → 광역 ❌
 * - N+숫자      → 심야 ✅
 * - 한글 포함   → 마을 ✅
 * - 숫자만      → 간선·지선·순환 ✅
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

// ── 지하철 ────────────────────────────────────────────────────────────────
/**
 * 기후동행카드 적용 지하철 노선 코드 (ODsay releaseReference 기준)
 *
 * 포함: 1~9호선, 공항철도(101), 경의중앙선(104),
 *       경강선(112), 우이신설선(113), 서해선(114), 김포골드라인(115),
 *       수인분당선(116), 신림선(117)
 * 제외: 신분당선(109) — 서울시 공식 제외 / GTX / 의정부경전철(110)
 */
const CLIMATE_SUBWAY_CODES = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  101, // 공항철도 (김포공항~서울역)
  104, // 경의중앙선
  112, // 경강선
  113, // 우이신설선
  114, // 서해선
  115, // 김포골드라인
  116, // 수인분당선
  117, // 신림선
]);

/**
 * 노선별 "허용 구간 밖" 역 이름 집합
 *
 * 해당 역이 passStopList에 포함되면 기후동행카드 불가로 판정.
 * 서울시는 노선 전체가 아닌 구간별로 허용 범위를 안내함:
 *   1호선: 도봉산 ~ 온수/금천구청 (소요산·인천·천안 방면 제외)
 *   4호선: 진접 ~ 정부과천청사 (인덕원 이남 제외)
 *   7호선: 장암 ~ 온수 (온수 이남 부천·경기 구간 제외)
 *   공항철도(101): 김포공항 ~ 서울역 (인천공항 구간 제외)
 *
 * TODO: stationName 대신 stationID 기반 판정으로 전환하면 더 정확.
 *       ODsay passStopList.stations[].stationID 확인 필요.
 */
const SUBWAY_EXCLUDED_STATIONS = {
  // 1호선 경기·충남·인천 방면 제외 역
  1: new Set([
    // 북부: 도봉산 이북 (경기 의정부·양주·동두천·연천 방면)
    '망월사', '회룡', '의정부', '가능', '녹양',
    '양주', '덕계', '덕정', '지행', '동두천중앙', '보산', '동두천', '소요산',
    // 서남부: 경기 인천 방면 (구로~인천 경인선)
    '역곡', '소사', '부천', '중동', '송내', '부개', '부평',
    '백운', '동암', '간석', '주안', '도화', '제물포', '도원', '동인천', '인천',
    // 남부: 경기·충남 방면 (금천구청 이남 1호선)
    '석수', '관악', '안양', '명학', '금정', '군포', '당정', '의왕',
    '성균관대', '화서', '수원', '세류', '병점', '세마', '오산대', '오산',
    '진위', '송탄', '서정리', '지제', '평택', '성환', '직산',
    '두정', '천안', '봉명', '쌍용', '아산', '탕정', '배방', '온양온천', '신창',
    // 광명 지선
    '광명',
  ]),
  // 4호선: 정부과천청사 이남 경기 구간
  4: new Set(['인덕원', '평촌', '범계', '금정']),
  // 7호선: 온수 이후 부천·인천 연장 구간 (온수~장암은 허용)
  // 까치울이 온수 다음 첫 연장역 — 이 하나만 있어도 연장선 전체 진입 판정 가능
  7: new Set([
    '까치울', '부천종합운동장', '신중동', '춘의', '부천시청',
    '상동', '삼산체육관', '굴포천', '부평구청', '산곡', '석남',
  ]),
  // 공항철도: 인천공항 구간
  101: new Set(['공항화물청사', '인천공항1터미널', '인천공항2터미널']),
};

/**
 * subPath의 passStopList가 해당 노선의 허용 구간 안에 있는지 검사
 */
function isWithinClimateZone(subPath, subwayCode) {
  const excluded = SUBWAY_EXCLUDED_STATIONS[subwayCode];
  if (!excluded) return true; // 구간 제한 없는 노선은 통과

  const stations = subPath.passStopList?.stations ?? [];
  return !stations.some((s) => excluded.has(s.stationName?.trim()));
}

// ── 구간별 판정 ───────────────────────────────────────────────────────────

function isSubPathClimate(subPath) {
  const { trafficType, lane = [] } = subPath;

  if (trafficType === 3) return true; // 도보는 항상 통과

  if (trafficType === 1) {
    // 지하철: 허용 노선 코드 1차 + 허용 구간 2차
    return lane.some((l) => {
      if (!CLIMATE_SUBWAY_CODES.has(l.subwayCode)) return false;
      return isWithinClimateZone(subPath, l.subwayCode);
    });
  }

  if (trafficType === 2) {
    // 버스: 판단 순서
    //   1) 명확 제외 타입 (광역·공항 등) → 면허 무관 제외
    //   2) busCityCode !== 1000(서울) → 타 지역 면허 제외
    //   3) ELIGIBLE_BUS_TYPES → 포함
    //   4) 노선번호 패턴 fallback
    return lane.some((l) => {
      if (INELIGIBLE_BUS_TYPES.has(l.type)) return false;
      // busCityCode가 명확히 비서울로 확인된 경우만 제외 (0 또는 미제공은 통과)
      if (l.busCityCode !== undefined && l.busCityCode !== 0 && l.busCityCode !== 1000) return false;
      if (ELIGIBLE_BUS_TYPES.has(l.type)) return true;
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
