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

export default function MapView({ center, stations, onStationSelect, routePath, bottomPadding = 0 }) {
  const tmapReady = useTmapReady();
  const mapRef = useRef(null);
  const wrapperRef = useRef(null);          // map-container-wrapper div ref
  const markersRef = useRef(new Map());     // stationId → marker
  const polylinesRef = useRef([]);
  const routeMarkersRef = useRef([]);
  const myLocationMarkerRef = useRef(null);
  const lastSelectRef = useRef(0);          // 중복 호출 방지
  // TMap API 없이 지도 뷰포트 추적 (center/zoom 직접 관리)
  const mapViewportRef = useRef({ lat: 37.5665, lng: 126.9780, zoom: 15 });

  // 항상 최신값 참조 (클로저 문제 방지)
  const stationsRef = useRef(stations);
  const onStationSelectRef = useRef(onStationSelect);
  useEffect(() => { stationsRef.current = stations; }, [stations]);
  useEffect(() => { onStationSelectRef.current = onStationSelect; }, [onStationSelect]);

  // 지도 초기화 — 1회만 실행
  useEffect(() => {
    if (!tmapReady || !center || mapRef.current) return;

    // 초기 뷰포트 설정 (GPS 위치 + zoom 15)
    mapViewportRef.current = { lat: center.lat, lng: center.lng, zoom: 15 };

    const map = new window.Tmapv2.Map('map-container', {
      center: new window.Tmapv2.LatLng(center.lat, center.lng),
      width: '100%',
      height: '100%',
      zoom: 15,
      zoomControl: false,
      scaleBar: false,
    });
    mapRef.current = map;

    myLocationMarkerRef.current = new window.Tmapv2.Marker({
      position: new window.Tmapv2.LatLng(center.lat, center.lng),
      map,
      icon: makeMyLocationIcon(),
      zIndex: 1000,
    });

    // 지도 클릭 (데스크탑)
    const handleMapTap = (e) => {
      if (!e.latLng) return;
      const now = Date.now();
      if (now - lastSelectRef.current < 500) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const THRESHOLD = 0.001;
      let closest = null, minDist = THRESHOLD;
      stationsRef.current.forEach((station) => {
        const d = Math.hypot(lat - station.lat, lng - station.lng);
        if (d < minDist) { minDist = d; closest = station; }
      });
      if (closest) { lastSelectRef.current = Date.now(); onStationSelectRef.current(closest); }
    };
    map.addListener('click', handleMapTap);
    try { map.addListener('tap', handleMapTap); } catch { /* 미지원 */ }

    // 지도 pan/zoom 추적 — TMap API 호출이 탭 시점에 필요 없도록
    const updateCenter = () => {
      try {
        const c = map.getCenter();
        if (c && typeof c.lat === 'function') {
          mapViewportRef.current = { ...mapViewportRef.current, lat: c.lat(), lng: c.lng() };
        }
      } catch { /* getCenter 미지원 시 마지막 known값 유지 */ }
    };
    try { map.addListener('center_changed', updateCenter); } catch { /* 미지원 */ }
    try { map.addListener('dragend', updateCenter); } catch { /* 미지원 */ }

    let showTimer = null;
    map.addListener('zoom_changed', () => {
      try {
        const z = map.getZoom();
        if (typeof z === 'number') mapViewportRef.current = { ...mapViewportRef.current, zoom: z };
      } catch { /* zoom 추적 실패 시 마지막 known값 유지 */ }
      markersRef.current.forEach(m => m.setVisible(false));
      clearTimeout(showTimer);
      showTimer = setTimeout(() => {
        markersRef.current.forEach(m => m.setVisible(true));
      }, 300);
    });
  }, [tmapReady, center]);

  // 모바일 터치 탭 감지 — document 레벨 capture로 TMap 내부 교체에 무관하게 동작
  const touchListenersRef = useRef(null);
  useEffect(() => {
    if (!tmapReady || !mapRef.current) return;
    if (touchListenersRef.current) return;

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
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      // 지도 영역 탭인지 확인 (시트/탭바/버튼 제외)
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!target || !wrapper.contains(target)) return;

      // TMap API 호출 없이 직접 추적한 뷰포트로 계산
      const { lat: cLat, lng: cLng, zoom } = mapViewportRef.current;
      const rect = wrapper.getBoundingClientRect();
      const px = touch.clientX - rect.left;
      const py = touch.clientY - rect.top;
      const metersPerPx = (156543.03392 * Math.cos(cLat * Math.PI / 180)) / Math.pow(2, zoom);
      const lat = cLat - ((py - rect.height / 2) * metersPerPx) / 111111;
      const lng = cLng + ((px - rect.width / 2) * metersPerPx) / (111111 * Math.cos(cLat * Math.PI / 180));

      const THRESHOLD = 0.001;
      let closest = null, minDist = THRESHOLD;
      stationsRef.current.forEach((s) => {
        const d = Math.hypot(lat - s.lat, lng - s.lng);
        if (d < minDist) { minDist = d; closest = s; }
      });
      if (closest) { lastSelectRef.current = Date.now(); onStationSelectRef.current(closest); }
    };

    document.addEventListener('touchstart', onTS, { passive: true, capture: true });
    document.addEventListener('touchmove',  onTM, { passive: true, capture: true });
    document.addEventListener('touchend',   onTE, { passive: true, capture: true });
    touchListenersRef.current = { onTS, onTM, onTE };
  }, [tmapReady, center]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (touchListenersRef.current) {
        const { onTS, onTM, onTE } = touchListenersRef.current;
        document.removeEventListener('touchstart', onTS, { capture: true });
        document.removeEventListener('touchmove',  onTM, { capture: true });
        document.removeEventListener('touchend',   onTE, { capture: true });
        touchListenersRef.current = null;
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

    markersRef.current.forEach((marker, id) => {
      if (!newIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

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
    const allCoords = [];

    const segmentColor = (sp) => {
      if (sp.trafficType === 3) return '#4b5563';
      if (sp.climateEligible === false) return '#d32f2f';
      if (sp.trafficType === 1) return '#1a56c4';
      return '#0ea5e9';
    };

    const drawPolyline = (coords, color, isDashed) => {
      if (coords.length < 2) return null;
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

      if (prevLastCoord) {
        drawPolyline([prevLastCoord, coords[0]], '#cccccc', true);
      }

      const color = segmentColor(subPath);
      const isDashed = subPath.trafficType === 3;
      drawPolyline(coords, color, isDashed);

      allCoords.push(...coords);
      prevLastCoord = coords[coords.length - 1];
    });

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
    <div className="map-container-wrapper" ref={wrapperRef} style={{ paddingBottom: bottomPadding }}>
      <div id="map-container" style={{ width: '100%', height: '100%' }} />
      <button className="gps-btn" onClick={handleRecenter} aria-label="내 위치로">
        <GpsIcon />
      </button>
    </div>
  );
}
