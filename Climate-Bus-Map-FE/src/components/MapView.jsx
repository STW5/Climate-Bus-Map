import { useEffect, useRef, useCallback } from 'react';
import { useTmapReady } from '../hooks/useTmapReady';

function GpsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export default function MapView({ center, stations, onStationSelect, routePath }) {
  const tmapReady = useTmapReady();
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);

  // 지도 초기화 (SDK 로드 + center 확정 후 1회)
  useEffect(() => {
    if (!tmapReady || !center) return;

    const map = new window.Tmapv2.Map('map-container', {
      center: new window.Tmapv2.LatLng(center.lat, center.lng),
      width: '100%',
      height: '100%',
      zoom: 15,
    });
    mapRef.current = map;

    return () => {
      map.destroy();
      mapRef.current = null;
    };
  }, [tmapReady, center]);

  // 마커 표시
  useEffect(() => {
    if (!mapRef.current || !tmapReady || stations.length === 0) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    stations.forEach((station) => {
      const marker = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(station.lat, station.lng),
        map: mapRef.current,
        title: station.stationName,
      });
      marker.addListener('click', () => onStationSelect(station));
      markersRef.current.push(marker);
    });
  }, [tmapReady, stations, onStationSelect]);

  // 경로 폴리라인 그리기
  useEffect(() => {
    if (!mapRef.current || !tmapReady) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!routePath) return;

    const subPaths = routePath.subPath ?? [];
    const allCoords = []; // 전체 좌표 (bounds 계산용)

    // 구간별 색상
    const segmentColor = (sp) => {
      if (sp.trafficType === 3) return '#9e9e9e';          // 도보: 회색
      if (sp.climateEligible === false) return '#d32f2f';   // 기후동행 불가: 빨강
      if (sp.trafficType === 1) return '#1a56c4';           // 지하철: 파랑
      return '#1a6b3a';                                     // 버스: 초록
    };

    const drawPolyline = (coords, color, isDashed) => {
      if (coords.length < 2) return null;
      // 흰색 테두리 (가독성)
      const outline = new window.Tmapv2.Polyline({
        path: coords,
        strokeColor: '#ffffff',
        strokeWeight: isDashed ? 0 : 8,
        strokeOpacity: 0.6,
        map: mapRef.current,
      });
      const line = new window.Tmapv2.Polyline({
        path: coords,
        strokeColor: color,
        strokeWeight: isDashed ? 3 : 5,
        strokeOpacity: isDashed ? 0.6 : 0.95,
        strokeStyle: isDashed ? 'dash' : 'solid',
        map: mapRef.current,
      });
      polylinesRef.current.push(outline, line);
      return line;
    };

    let prevLastCoord = null;

    subPaths.forEach((subPath) => {
      const stationList = subPath.passStopList?.stations ?? [];
      const coords = stationList
        .map((s) => {
          const lat = parseFloat(s.y), lng = parseFloat(s.x);
          if (!lat || !lng) return null;
          return new window.Tmapv2.LatLng(lat, lng);
        })
        .filter(Boolean);

      if (coords.length === 0) return;

      // 이전 구간 끝 → 현재 구간 시작 연결 (끊김 방지)
      if (prevLastCoord) {
        drawPolyline([prevLastCoord, coords[0]], '#cccccc', true);
      }

      const color = segmentColor(subPath);
      const isDashed = subPath.trafficType === 3;
      drawPolyline(coords, color, isDashed);

      allCoords.push(...coords);
      prevLastCoord = coords[coords.length - 1];
    });

    // 전체 경로 보이도록 지도 범위 조정
    if (allCoords.length > 0) {
      const lats = allCoords.map((c) => c.lat());
      const lngs = allCoords.map((c) => c.lng());
      const sw = new window.Tmapv2.LatLng(Math.min(...lats), Math.min(...lngs));
      const ne = new window.Tmapv2.LatLng(Math.max(...lats), Math.max(...lngs));
      mapRef.current.fitBounds(new window.Tmapv2.LatLngBounds(sw, ne));
    }
  }, [tmapReady, routePath]);

  const handleRecenter = useCallback(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.panTo(new window.Tmapv2.LatLng(center.lat, center.lng));
  }, [center]);

  if (!tmapReady) {
    return (
      <div className="map-loading">
        <div className="loading-spinner" />
        <span>지도 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="map-container-wrapper">
      <div id="map-container" style={{ width: '100%', height: '100%' }} />
      <button className="gps-btn" onClick={handleRecenter} aria-label="내 위치로">
        <GpsIcon />
      </button>
    </div>
  );
}
