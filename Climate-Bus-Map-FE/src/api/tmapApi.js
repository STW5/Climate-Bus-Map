const TMAP_BASE = 'https://apis.sktelecom.com/v1/tmap';
const APP_KEY = import.meta.env.VITE_TMAP_API_KEY;

/**
 * T-Map POI 키워드 검색
 * @param {string} keyword
 * @returns {Promise<Array<{name: string, lat: number, lng: number}>>}
 */
export async function searchPlace(keyword) {
  const params = new URLSearchParams({
    version: 1,
    searchKeyword: keyword,
    appKey: APP_KEY,
    count: 5,
    resCoordType: 'WGS84GEO',
  });

  const res = await fetch(`${TMAP_BASE}/pois?${params}`);
  if (!res.ok) throw new Error(`T-Map POI 오류: HTTP ${res.status}`);
  const json = await res.json();

  const pois = json.searchPoiInfo?.pois?.poi ?? [];
  return pois.map((p) => ({
    name: p.name,
    address: `${p.upperAddrName ?? ''} ${p.middleAddrName ?? ''} ${p.lowerAddrName ?? ''}`.trim(),
    lat: parseFloat(p.noorLat),
    lng: parseFloat(p.noorLon),
  }));
}
