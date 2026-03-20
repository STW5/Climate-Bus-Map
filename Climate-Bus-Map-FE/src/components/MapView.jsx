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

const makeBusStopIcon = () => {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26">',
    '<circle cx="13" cy="13" r="12" fill="#1a73e8" stroke="white" stroke-width="2.5"/>',
    '<text x="13" y="17" text-anchor="middle" fill="white" font-size="9" font-family="-apple-system,Arial,sans-serif" font-weight="700">정류장</text>',
    '</svg>',
  ].join('');
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

const makeMyLocationIcon = () => {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">',
    '<circle cx="12" cy="12" r="10" fill="#1a73e8" opacity="0.2"/>',
    '<circle cx="12" cy="12" r="6" fill="#1a73e8"/>',
    '<circle cx="12" cy="12" r="6" fill="none" stroke="white" stroke-width="2"/>',
    '</svg>',
  ].join('');
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

export default function MapView({ center, stations, onStationSelect, routePath }) {
  const tmapReady = useTmapReady();
  const mapRef = useRef(null);
  const markersRef = useRef(new Map()); // stationId → marker
  const polylinesRef = useRef([]);
  const routeMarkersRef = useRef([]);
  const myLocationMarkerRef = useRef(null);
  const lastSelectRef = useRef(0); // 중복 호출 방지

  // 항상 최신값 참조 (클로저 문제 방지)
  const stationsRef = useRef(stations);
  const onStationSelectRef = useRef(onStationSelect);
  useEffect(() => { stationsRef.current = stations; }, [stations]);
  useEffect(() => { onStationSelectRef.current = onStationSelect; }, [onStationSelect]);

  // 지도 초기화 — center dep 변경 시 cleanup 없이 1회만 실행
  // cleanup을 반환하지 않으므로 center 변경 시 지도 재생성 없음
  useEffect(() => {
    if (!tmapReady || !center || mapRef.current) return;

    const map = new window.Tmapv2.Map('map-container', {
      center: new window.Tmapv2.LatLng(center.lat, center.lng),
      width: '100%',
      height: '100%',
      zoom: 15,
    });
    mapRef.current = map;

    myLocationMarkerRef.current = new window.Tmapv2.Marker({
      position: new window.Tmapv2.LatLng(center.lat, center.lng),
      map,
      icon: makeMyLocationIcon(),
      zIndex: 1000,
    });

    // 지도 클릭/탭 → 가장 가까운 정류장 선택
    const handleMapTap = (e) => {
      if (!e.latLng) return;
      const now = Date.now();
      if (now - lastSelectRef.current < 500) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const THRESHOLD = 0.001; // ~110m
      let closest = null;
      let minDist = THRESHOLD;
      stationsRef.current.forEach((station) => {
        const d = Math.hypot(lat - station.lat, lng - station.lng);
        if (d < minDist) { minDist = d; closest = station; }
      });
      if (closest) { lastSelectRef.current = Date.now(); onStationSelectRef.current(closest); }
    };
    map.addListener('click', handleMapTap);
    // TMap 모바일 전용 이벤트 시도 (지원 여부 불확실)
    try { map.addListener('tap', handleMapTap); } catch { /* 미지원 */ }

    let showTimer = null;
    map.addListener('zoom_changed', () => {
      markersRef.current.forEach(m => m.setVisible(false));
      clearTimeout(showTimer);
      showTimer = setTimeout(() => {
        markersRef.current.forEach(m => m.setVisible(true));
      }, 300);
    });
    // cleanup 없음 — center 변경 시 지도 파괴 방지
  }, [tmapReady, center]);

  // 모바일 touchend → 가장 가까운 정류장 선택 (TMap click 이벤트 모바일 미지원 대응)
  const touchListenersRef = useRef(null);
  useEffect(() => {
    if (!tmapReady || !mapRef.current) return;
    const mapEl = document.getElementById('map-container');
    if (!mapEl || touchListenersRef.current) return;

    let touchStartX = 0, touchStartY = 0, moved = false;
    const onTS = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      moved = false;
    };
    const onTM = (e) => {
      if (Math.abs(e.touches[0].clientX - touchStartX) > 10 ||
          Math.abs(e.touches[0].clientY - touchStartY) > 10) moved = true;
    };
    const onTE = (e) => {
      if (moved) return;
      const now = Date.now();
      if (now - lastSelectRef.current < 500) return;
      const touch = e.changedTouches[0];
      const rect = mapEl.getBoundingClientRect();
      const px = touch.clientX - rect.left;
      const py = touch.clientY - rect.top;
      try {
        // getBounds() 미지원 대비: getCenter+getZoom 기반 계산
        const mapCenter = mapRef.current.getCenter();
        const zoom = mapRef.current.getZoom();
        const metersPerPx = (156543.03392 * Math.cos(mapCenter.lat() * Math.PI / 180)) / Math.pow(2, zoom);
        const lat = mapCenter.lat() - ((py - rect.height / 2) * metersPerPx) / 111111;
        const lng = mapCenter.lng() + ((px - rect.width / 2) * metersPerPx) / (111111 * Math.cos(mapCenter.lat() * Math.PI / 180));
        const THRESHOLD = 0.001;
        let closest = null, minDist = THRESHOLD;
        stationsRef.current.forEach((s) => {
          const d = Math.hypot(lat - s.lat, lng - s.lng);
          if (d < minDist) { minDist = d; closest = s; }
        });
        if (closest) { lastSelectRef.current = Date.now(); onStationSelectRef.current(closest); }
      } catch { /* ignore */ }
    };

    mapEl.addEventListener('touchstart', onTS, { passive: true, capture: true });
    mapEl.addEventListener('touchmove', onTM,  { passive: true, capture: true });
    mapEl.addEventListener('touchend',   onTE,  { passive: true, capture: true });
    touchListenersRef.current = { mapEl, onTS, onTM, onTE };
  }, [tmapReady, center]);  // map 초기화 후 1회만 실행 (center 의존 추가: TMap보다 위치가 늦게 오는 경우 대비)

  // 언마운트 시에만 지도 정리
  useEffect(() => {
    return () => {
      if (touchListenersRef.current) {
        const { mapEl, onTS, onTM, onTE } = touchListenersRef.current;
        mapEl.removeEventListener('touchstart', onTS, { capture: true });
        mapEl.removeEventListener('touchmove',  onTM, { capture: true });
        mapEl.removeEventListener('touchend',   onTE, { capture: true });
      }
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setMap(null);
        myLocationMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  // 내 위치 마커 실시간 업데이트
  useEffect(() => {
    if (!myLocationMarkerRef.current || !center) return;
    myLocationMarkerRef.current.setPosition(
      new window.Tmapv2.LatLng(center.lat, center.lng)
    );
  }, [center]);

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
        icon: makeBusStopIcon(),
        iconSize: new window.Tmapv2.Size(26, 26),
      });
      const selectThis = () => {
        const now = Date.now();
        if (now - lastSelectRef.current < 500) return;
        lastSelectRef.current = Date.now();
        onStationSelectRef.current(station);
      };
      marker.addListener('click', selectThis);
      marker.addListener('touchend', selectThis);
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
