import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MapView from './components/MapView';
import ArrivalPanel from './components/ArrivalPanel';
import FilterToggle from './components/FilterToggle';
import ClimateRoutesPanel from './components/ClimateRoutesPanel';
import FavoritesPanel from './components/FavoritesPanel';
import RouteResultPanel from './components/RouteResultPanel';
import SelectedRoutePanel from './components/SelectedRoutePanel';
import DraggableBottomSheet from './components/DraggableBottomSheet';
import BottomTabBar from './components/BottomTabBar';
import FloatingSearchBar from './components/FloatingSearchBar';
import { useGeolocation } from './hooks/useGeolocation';
import { fetchNearbyStations, fetchArrivals, fetchNearbyClimateRoutes, fetchBoardingTime, fetchSegmentBoardingTimes } from './api/busApi';
import { searchTransitRoute, loadLaneForPath } from './api/odsayApi';
import { getWalkingRoute } from './api/tmapApi';
import { getSubPathClimateFlags } from './utils/climateChecker';
import { getFavorites } from './utils/favorites';
import './App.css';

// 바텀 시트 스냅 포인트 (peek / half / full)
function useSnapPoints() {
  return useMemo(() => {
    const vh = window.innerHeight;
    return [
      Math.round(vh * 0.14),  // peek: ~100px on 720px screen
      Math.round(vh * 0.46),  // half
      Math.round(vh * 0.84),  // full
    ];
  }, []);
}

export default function App() {
  const { position, isFallback } = useGeolocation();

  const [stations, setStations] = useState([]);
  const [stationsError, setStationsError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [arrivalError, setArrivalError] = useState(null);

  const [favorites, setFavorites] = useState(getFavorites);
  const refreshFavorites = useCallback(() => setFavorites(getFavorites()), []);

  const [filterActive, setFilterActive] = useState(false);

  const [climateRoutes, setClimateRoutes] = useState([]);
  const [climateStationIds, setClimateStationIds] = useState(new Set());
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState(null);

  const [routeLoading, setRouteLoading] = useState(false);
  const [routePaths, setRoutePaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [boardingTimes, setBoardingTimes] = useState([]);
  const [selectedBoardingTime, setSelectedBoardingTime] = useState(null);
  const [segmentBoardingTimes, setSegmentBoardingTimes] = useState([]);
  const selectedPathRef = useRef(null);

  // 모바일 UX: 탭 + 바텀 시트 스냅
  const [activeTab, setActiveTab] = useState('nearby');
  const [sheetSnap, setSheetSnap] = useState(0); // 0=peek, 1=half, 2=full
  const [searchOpen, setSearchOpen] = useState(false);
  const snapPoints = useSnapPoints();

  // 탭바 숨김: 경로 결과/선택 중
  const tabBarHidden = !!selectedPath || routePaths.length > 0 || routeLoading;

  // ── 데이터 페칭 ──────────────────────────────────
  useEffect(() => {
    if (!position) return;
    setStationsError(null);
    fetchNearbyStations(position.lat, position.lng)
      .then(setStations)
      .catch((e) => setStationsError(e.message));
  }, [position]);

  useEffect(() => {
    if (!position) return;
    setClimateLoading(true);
    setClimateError(null);
    fetchNearbyClimateRoutes(position.lat, position.lng)
      .then((data) => {
        setClimateRoutes(data.routes || []);
        setClimateStationIds(new Set(data.climateStationIds || []));
      })
      .catch((e) => setClimateError(e.message))
      .finally(() => setClimateLoading(false));
  }, [position]);

  // ── 정류장 선택 ──────────────────────────────────
  const handleStationSelect = useCallback(async (station) => {
    setSelectedStation(station);
    setArrivals([]);
    setArrivalError(null);
    setArrivalLoading(true);
    setSheetSnap(1); // half로 열기
    try {
      const data = await fetchArrivals(station.stationId);
      const fetchedAt = Date.now();
      setArrivals(data.map(a => ({ ...a, fetchedAt })));
    } catch (e) {
      setArrivalError(e.message);
    } finally {
      setArrivalLoading(false);
    }
  }, []);

  // 30초마다 도착 정보 재조회
  useEffect(() => {
    if (!selectedStation) return;
    const id = setInterval(async () => {
      try {
        const data = await fetchArrivals(selectedStation.stationId);
        const fetchedAt = Date.now();
        setArrivals(data.map(a => ({ ...a, fetchedAt })));
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(id);
  }, [selectedStation]);

  const handleStationClose = useCallback(() => {
    setSelectedStation(null);
    setArrivals([]);
    setArrivalError(null);
    setSheetSnap(0); // peek으로 복귀
  }, []);

  // ── 경로 탐색 ──────────────────────────────────
  const handleRouteSearch = useCallback(async (start, destination) => {
    if (!position) return;
    setSelectedStation(null);
    setArrivals([]);
    setArrivalError(null);
    setRouteLoading(true);
    setRoutePaths([]);
    setSelectedPath(null);
    setBoardingTimes([]);
    setSheetSnap(1);
    try {
      const paths = await searchTransitRoute(start || position, destination);
      const actualStart = start || position;
      const tagged = paths.map((path) => ({
        ...path,
        _start: actualStart,
        _end: destination,
        subPath: getSubPathClimateFlags(path.subPath ?? []),
      }));
      setRoutePaths(tagged);
      Promise.all(tagged.map(p => fetchBoardingTime(p.subPath ?? []))).then(setBoardingTimes);
    } catch (e) {
      alert(e.message);
    } finally {
      setRouteLoading(false);
    }
  }, [position]);

  const handleSelectPath = useCallback(async (path, pathIndex) => {
    setSelectedBoardingTime(boardingTimes[pathIndex] ?? null);
    const withLane = await loadLaneForPath(path.info?.mapObj, path.subPath ?? []);

    const segCoord = (sp, last = false) => {
      if (!sp) return null;
      if (sp.graphPos?.length) {
        const p = last ? sp.graphPos[sp.graphPos.length - 1] : sp.graphPos[0];
        return { lat: parseFloat(p.y), lng: parseFloat(p.x) };
      }
      const stations = sp.passStopList?.stations ?? [];
      if (stations.length > 0) {
        const s = last ? stations[stations.length - 1] : stations[0];
        return { lat: parseFloat(s.y), lng: parseFloat(s.x) };
      }
      return null;
    };

    const withWalking = await Promise.all(
      withLane.map(async (sp, i) => {
        if (sp.trafficType !== 3) return sp;
        const startCoord = segCoord(withLane[i - 1], true) ?? path._start;
        const endCoord   = segCoord(withLane[i + 1], false) ?? path._end;
        if (!startCoord || !endCoord) return sp;
        const walkCoords = await getWalkingRoute(startCoord.lat, startCoord.lng, endCoord.lat, endCoord.lng);
        return walkCoords ? { ...sp, graphPos: walkCoords } : sp;
      })
    );

    const finalPath = { ...path, subPath: withWalking };
    setSelectedPath(finalPath);
    selectedPathRef.current = finalPath;
    setSheetSnap(0); // 지도 보기 우선 (peek)
    fetchSegmentBoardingTimes(finalPath.subPath).then(setSegmentBoardingTimes);
  }, [boardingTimes]);

  // 30초마다 구간별 도착 시간 재조회
  useEffect(() => {
    if (!selectedPathRef.current) return;
    const id = setInterval(() => {
      if (selectedPathRef.current) {
        fetchSegmentBoardingTimes(selectedPathRef.current.subPath).then(setSegmentBoardingTimes);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [selectedPath]);

  const handleRouteClose = useCallback(() => {
    setRoutePaths([]);
    setSelectedPath(null);
    selectedPathRef.current = null;
    setBoardingTimes([]);
    setSelectedBoardingTime(null);
    setSegmentBoardingTimes([]);
    setSheetSnap(0);
  }, []);

  // ── 탭 네비게이션 ──────────────────────────────
  const handleTabChange = useCallback((tab) => {
    if (tab === activeTab) {
      // 같은 탭 재클릭: peek ↔ half 토글
      setSheetSnap(prev => prev === 0 ? 1 : 0);
    } else {
      setActiveTab(tab);
      if (tab !== 'route') {
        setSheetSnap(1); // half로 열기
      } else {
        setSheetSnap(0); // 경로 탭: 지도 보이게
      }
    }
  }, [activeTab]);

  const handleSheetClose = useCallback(() => {
    setSheetSnap(0);
  }, []);

  // ── 필터 ──────────────────────────────────────
  const displayedStations = useMemo(() => {
    if (!filterActive) return stations;
    return stations.filter((s) => climateStationIds.has(s.stationId));
  }, [filterActive, stations, climateStationIds]);

  // ── 바텀 시트 컨텐츠 결정 ──────────────────────
  const sheetContent = useMemo(() => {
    if (selectedPath) {
      return (
        <SelectedRoutePanel
          path={selectedPath}
          boardingTime={selectedBoardingTime}
          segmentBoardingTimes={segmentBoardingTimes}
          onBack={() => { setSelectedPath(null); setSheetSnap(1); }}
          onClose={handleRouteClose}
        />
      );
    }
    if (routePaths.length > 0 || routeLoading) {
      return (
        <RouteResultPanel
          paths={routePaths}
          loading={routeLoading}
          boardingTimes={boardingTimes}
          onSelectPath={handleSelectPath}
          selectedPath={selectedPath}
          onClose={() => { setRoutePaths([]); setSelectedPath(null); setBoardingTimes([]); setSheetSnap(0); }}
        />
      );
    }
    if (selectedStation) {
      return (
        <ArrivalPanel
          station={selectedStation}
          arrivals={arrivals}
          loading={arrivalLoading}
          error={arrivalError}
          onClose={handleStationClose}
          onFavoriteChange={refreshFavorites}
        />
      );
    }
    if (activeTab === 'favorites') {
      return (
        <FavoritesPanel
          favorites={favorites}
          onStationSelect={handleStationSelect}
          onFavoriteChange={refreshFavorites}
        />
      );
    }
    return (
      <ClimateRoutesPanel
        routes={climateRoutes}
        loading={climateLoading}
        error={climateError}
      />
    );
  }, [
    selectedPath, routePaths, routeLoading, selectedStation, activeTab, favorites,
    arrivals, arrivalLoading, arrivalError, climateRoutes, climateLoading, climateError,
    boardingTimes, selectedBoardingTime, segmentBoardingTimes,
    handleRouteClose, handleStationClose, handleSelectPath, handleStationSelect, refreshFavorites,
  ]);

  return (
    <div className={`app${searchOpen ? ' app--search-open' : ''}`}>
      {/* ── 전체화면 지도 ── */}
      <div className="map-layer">
        {position ? (
          <MapView
            center={position}
            stations={displayedStations}
            onStationSelect={handleStationSelect}
            routePath={selectedPath}
          />
        ) : (
          <div className="loading-screen">
            <div className="loading-spinner" />
            위치 정보를 가져오는 중...
          </div>
        )}
      </div>

      {/* ── Floating 검색바 ── */}
      <FloatingSearchBar
        forceOpen={activeTab === 'route' && !selectedPath && !routePaths.length}
        onSearch={handleRouteSearch}
        onClear={handleRouteClose}
        currentPosition={position}
        isLocked={!!selectedPath}
        isFallback={isFallback}
        onOpenChange={(isOpen) => {
          setSearchOpen(isOpen);
          if (isOpen) setSheetSnap(0); // 모바일: 검색 시 시트 접기
        }}
      />

      {/* ── 지도 우측 FAB (필터 + GPS는 MapView 내부) ── */}
      <div className={`map-fab-group${tabBarHidden ? ' map-fab-group--route' : ''}`}>
        <FilterToggle active={filterActive} onToggle={() => setFilterActive((v) => !v)} />
      </div>

      {/* ── 에러 토스트 ── */}
      {stationsError && (
        <div className="stations-error">정류장 로드 실패: {stationsError}</div>
      )}

      {/* ── 드래그 바텀 시트 ── */}
      <DraggableBottomSheet
        snapPoints={snapPoints}
        snapIndex={sheetSnap}
        onSnapChange={setSheetSnap}
        onClose={handleSheetClose}
      >
        {sheetContent}
      </DraggableBottomSheet>

      {/* ── 하단 탭 네비게이션 ── */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hidden={tabBarHidden}
      />
    </div>
  );
}
