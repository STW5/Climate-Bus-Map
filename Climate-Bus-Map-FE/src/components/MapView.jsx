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

    // 이전 폴리라인 제거
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!routePath) return;

    const subPaths = routePath.subPath ?? [];
    subPaths.forEach((subPath) => {
      if (subPath.trafficType === 3) return; // 도보 제외

      const stations = subPath.passStopList?.stations ?? [];
      if (stations.length < 2) return;

      const path = stations.map((s) => new window.Tmapv2.LatLng(parseFloat(s.y), parseFloat(s.x)));
      const color = subPath.climateEligible === false ? '#d32f2f' : '#1a6b3a';

      const polyline = new window.Tmapv2.Polyline({
        path,
        strokeColor: color,
        strokeWeight: 5,
        strokeOpacity: 0.85,
        map: mapRef.current,
      });
      polylinesRef.current.push(polyline);
    });

    // 첫 번째 정류소로 지도 이동
    const firstStation = subPaths.find((p) => p.trafficType !== 3)?.passStopList?.stations?.[0];
    if (firstStation) {
      mapRef.current.panTo(new window.Tmapv2.LatLng(parseFloat(firstStation.y), parseFloat(firstStation.x)));
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
