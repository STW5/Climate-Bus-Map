const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchNearbyStations(lat, lng, radius = 500) {
  const res = await fetch(`${BASE_URL}/api/v1/stations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.stations;
}

export async function fetchArrivals(stationId) {
  const res = await fetch(`${BASE_URL}/api/v1/stations/${stationId}/arrivals`);
  if (!res.ok) throw new Error(`서버 오류 (HTTP ${res.status})`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.arrivals;
}

export async function fetchNearbyClimateRoutes(lat, lng, radius = 500) {
  const res = await fetch(`${BASE_URL}/api/v1/stations/nearby/climate-routes?lat=${lat}&lng=${lng}&radius=${radius}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

/**
 * 경로의 첫 번째 버스 구간 탑승 대기 시간 조회
 * @param {object[]} subPaths - ODsay subPath 배열
 * @returns {Promise<{arrivalSec: number, routeNo: string}|null>}
 */
async function fetchOneBusArrival(subPath) {
  const stations = subPath.passStopList?.stations ?? [];
  const routeNo = subPath.lane?.[0]?.busNo;
  if (!stations.length || !routeNo) return null;

  const lat = parseFloat(stations[0].y);
  const lng = parseFloat(stations[0].x);
  if (!lat || !lng) return null;

  try {
    const nearby = await fetchNearbyStations(lat, lng, 150);
    for (const station of nearby.slice(0, 3)) {
      const arrivals = await fetchArrivals(station.stationId);
      const match = arrivals.find(a => String(a.routeNo) === String(routeNo));
      if (match) return { arrivalSec: match.arrivalSec1, routeNo };
    }
    return null;
  } catch {
    return null;
  }
}

// 경로 목록용: 첫 버스 구간의 탑승 대기시간만 조회
export async function fetchBoardingTime(subPaths) {
  const firstBus = subPaths.find(sp => sp.trafficType === 2);
  if (!firstBus) return null;
  return fetchOneBusArrival(firstBus);
}

// 상세 뷰용: 모든 버스 구간의 탑승 대기시간 조회 (subPaths 인덱스 기준, 버스 아닌 구간은 null)
export async function fetchSegmentBoardingTimes(subPaths) {
  return Promise.all(
    subPaths.map(sp => sp.trafficType === 2 ? fetchOneBusArrival(sp) : Promise.resolve(null))
  );
}

export async function fetchClimateEligibleRouteIds() {
  const res = await fetch(`${BASE_URL}/api/v1/routes/climate-eligible`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.routeIds;
}
