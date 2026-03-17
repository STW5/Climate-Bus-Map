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
  const markersRef = useRef(new Map()); // stationId → marker
  const polylinesRef = useRef([]);
  const routeMarkersRef = useRef([]);

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

    // 줌 중 마커 숨기기 → 줌 완료 후 복원 (렌더링 부하 감소)
    let showTimer = null;
    map.addListener('zoom_changed', () => {
      markersRef.current.forEach(m => m.setVisible(false));
      clearTimeout(showTimer);
      showTimer = setTimeout(() => {
        markersRef.current.forEach(m => m.setVisible(true));
      }, 300);
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
      map.destroy();
      mapRef.current = null;
    };
  }, [tmapReady, center]);

  // 마커 표시 (diff: 변경된 것만 추가/제거)
  useEffect(() => {
    if (!mapRef.current || !tmapReady) return;

    const newIds = new Set(stations.map((s) => s.stationId));

    // 제거: 현재 맵에 없는 마커 삭제
    markersRef.current.forEach((marker, id) => {
      if (!newIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // 추가: 새로 생긴 정류소만 마커 생성
    stations.forEach((station) => {
      if (markersRef.current.has(station.stationId)) return;
      const marker = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(station.lat, station.lng),
        map: mapRef.current,
        title: station.stationName,
      });
      marker.addListener('click', () => onStationSelect(station));
      markersRef.current.set(station.stationId, marker);
    });
  }, [tmapReady, stations, onStationSelect]);

  // 경로 폴리라인 그리기
  useEffect(() => {
    if (!mapRef.current || !tmapReady) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    routeMarkersRef.current.forEach((m) => { try { m.setMap(null); } catch { m.close?.(); } });
    routeMarkersRef.current = [];

    if (!routePath) return;

    const subPaths = routePath.subPath ?? [];
    const allCoords = []; // 전체 좌표 (bounds 계산용)

    // 구간별 색상
    const segmentColor = (sp) => {
      if (sp.trafficType === 3) return '#4b5563';          // 도보: 진회색
      if (sp.climateEligible === false) return '#d32f2f';   // 기후동행 불가: 빨강
      if (sp.trafficType === 1) return '#1a56c4';           // 지하철: 파랑
      return '#0ea5e9';                                     // 버스: 하늘
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
        strokeWeight: isDashed ? 4 : 5,
        strokeOpacity: isDashed ? 0.85 : 0.95,
        strokeStyle: isDashed ? 'dash' : 'solid',
        map: mapRef.current,
      });
      polylinesRef.current.push(outline, line);
      return line;
    };

    let prevLastCoord = null;

    subPaths.forEach((subPath) => {
      let coords;
      if (subPath.graphPos?.length) {
        coords = subPath.graphPos.map((p) => {
          const lat = parseFloat(p.y), lng = parseFloat(p.x);
          return (lat && lng) ? new window.Tmapv2.LatLng(lat, lng) : null;
        }).filter(Boolean);
      } else {
        coords = (subPath.passStopList?.stations ?? []).map((s) => {
          const lat = parseFloat(s.y), lng = parseFloat(s.x);
          return (lat && lng) ? new window.Tmapv2.LatLng(lat, lng) : null;
        }).filter(Boolean);
      }

      // 도보 구간: stations 없으면 startX/Y → endX/Y 직선
      if (coords.length === 0 && subPath.trafficType === 3) {
        const sLat = parseFloat(subPath.startY), sLng = parseFloat(subPath.startX);
        const eLat = parseFloat(subPath.endY), eLng = parseFloat(subPath.endX);
        if (sLat && sLng && eLat && eLng) {
          coords = [
            new window.Tmapv2.LatLng(sLat, sLng),
            new window.Tmapv2.LatLng(eLat, eLng),
          ];
        }
      }

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

    // 전체 경로 보이도록 지도 범위 조정 + 출발/도착 마커
    if (allCoords.length > 0) {
      const lats = allCoords.map((c) => c.lat());
      const lngs = allCoords.map((c) => c.lng());
      const sw = new window.Tmapv2.LatLng(Math.min(...lats), Math.min(...lngs));
      const ne = new window.Tmapv2.LatLng(Math.max(...lats), Math.max(...lngs));
      mapRef.current.fitBounds(new window.Tmapv2.LatLngBounds(sw, ne));

      const makePinIcon = (text, bg) => {
        const w = text.length * 9 + 22, h = 36;
        const svg = [
          `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`,
          `<rect x="0" y="0" width="${w}" height="26" rx="13" fill="${bg}"/>`,
          `<polygon points="${w/2-6},26 ${w/2+6},26 ${w/2},34" fill="${bg}"/>`,
          `<text x="${w/2}" y="18" text-anchor="middle" fill="white" font-size="12" font-family="-apple-system,Arial,sans-serif" font-weight="700">${text}</text>`,
          `</svg>`,
        ].join('');
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
      };

      const addPin = (latLng, text, bg) => {
        const m = new window.Tmapv2.Marker({
          position: latLng,
          map: mapRef.current,
          icon: makePinIcon(text, bg),
        });
        routeMarkersRef.current.push(m);
      };

      const startCoord = routePath._start
        ? new window.Tmapv2.LatLng(routePath._start.lat, routePath._start.lng)
        : allCoords[0];
      const endCoord = routePath._end
        ? new window.Tmapv2.LatLng(routePath._end.lat, routePath._end.lng)
        : allCoords[allCoords.length - 1];

      addPin(startCoord, '출발', '#0ea5e9');
      addPin(endCoord, '도착', '#e11d48');
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
