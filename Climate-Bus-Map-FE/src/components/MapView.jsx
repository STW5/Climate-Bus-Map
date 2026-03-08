import { useEffect, useRef } from 'react';
import { useTmapReady } from '../hooks/useTmapReady';

export default function MapView({ center, stations, onStationSelect }) {
  const tmapReady = useTmapReady();
  const mapRef = useRef(null);
  const markersRef = useRef([]);

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

  if (!tmapReady) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>지도 로딩 중...</div>;
  }

  return <div id="map-container" style={{ width: '100%', height: '100%' }} />;
}
