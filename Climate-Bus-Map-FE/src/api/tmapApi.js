const TMAP_BASE = 'https://apis.openapi.sk.com/tmap';
const APP_KEY = import.meta.env.VITE_TMAP_API_KEY;

/**
 * T-Map POI 키워드 검색
 */
async function searchPoi(keyword) {
  const params = new URLSearchParams({
    version: 1,
    searchKeyword: keyword,
    appKey: APP_KEY,
    count: 5,
    resCoordType: 'WGS84GEO',
  });

  const res = await fetch(`${TMAP_BASE}/pois?${params}`);
  if (!res.ok) return [];
  const json = await res.json();

  const pois = json.searchPoiInfo?.pois?.poi ?? [];
  return pois.map((p) => ({
    name: p.name,
    address: `${p.upperAddrName ?? ''} ${p.middleAddrName ?? ''} ${p.lowerAddrName ?? ''}`.trim(),
    lat: parseFloat(p.noorLat),
    lng: parseFloat(p.noorLon),
  })).filter((p) => p.lat && p.lng);
}

/**
 * T-Map 주소 지오코딩 (지번/도로명 주소 → 좌표)
 */
async function searchAddress(keyword) {
  const params = new URLSearchParams({
    version: 1,
    searchText: keyword,
    appKey: APP_KEY,
    addressFlag: 'F00', // 지번+도로명 통합
    coordType: 'WGS84GEO',
    count: 5,
  });

  const res = await fetch(`${TMAP_BASE}/geo/fullTextSearch?${params}`);
  if (!res.ok) return [];
  const json = await res.json();

  const coords = json.coordinateInfo?.coordinate ?? [];
  return coords
    .filter((c) => c.lat && c.lon)
    .map((c) => ({
      name: c.fullAddressRoad || c.fullAddress || keyword,
      address: c.fullAddress || '',
      lat: parseFloat(c.lat),
      lng: parseFloat(c.lon),
    }));
}

/**
 * T-Map 보행자 경로 — 실제 보행로 좌표 반환
 * @returns {Promise<Array<{x:string,y:string}>|null>} graphPos 형식 배열
 */
export async function getWalkingRoute(startLat, startLng, endLat, endLng) {
  try {
    const res = await fetch(`${TMAP_BASE}/routes/pedestrian?version=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', appKey: APP_KEY },
      body: JSON.stringify({
        startX: String(startLng),
        startY: String(startLat),
        endX: String(endLng),
        endY: String(endLat),
        reqCoordType: 'WGS84GEO',
        resCoordType: 'WGS84GEO',
        startName: '출발',
        endName: '도착',
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();

    const coords = [];
    for (const feature of json.features ?? []) {
      if (feature.geometry?.type === 'LineString') {
        for (const [lng, lat] of feature.geometry.coordinates) {
          coords.push({ x: String(lng), y: String(lat) });
        }
      }
    }
    return coords.length > 0 ? coords : null;
  } catch {
    return null;
  }
}

/**
 * POI + 주소 통합 검색
 * @param {string} keyword
 * @returns {Promise<Array<{name, address, lat, lng}>>}
 */
export async function searchPlace(keyword) {
  const [pois, addrs] = await Promise.allSettled([searchPoi(keyword), searchAddress(keyword)]);

  const poiList = pois.status === 'fulfilled' ? pois.value : [];
  const addrList = addrs.status === 'fulfilled' ? addrs.value : [];

  // POI 결과 먼저, 주소 결과 뒤에 (중복 좌표 제거)
  const seen = new Set();
  return [...poiList, ...addrList].filter((item) => {
    const key = `${item.lat.toFixed(4)},${item.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
