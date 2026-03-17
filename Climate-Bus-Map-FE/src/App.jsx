import { useState, useEffect, useCallback, useMemo } from 'react';
import MapView from './components/MapView';
import ArrivalPanel from './components/ArrivalPanel';
import FilterToggle from './components/FilterToggle';
import ClimateRoutesPanel from './components/ClimateRoutesPanel';
import RouteSearchPanel from './components/RouteSearchPanel';
import RouteResultPanel from './components/RouteResultPanel';
import SelectedRoutePanel from './components/SelectedRoutePanel';
import { useGeolocation } from './hooks/useGeolocation';
import { fetchNearbyStations, fetchArrivals, fetchNearbyClimateRoutes, fetchBoardingTime, fetchSegmentBoardingTimes } from './api/busApi';
import { searchTransitRoute, loadLaneForPath } from './api/odsayApi';
import { getWalkingRoute } from './api/tmapApi';
import { getSubPathClimateFlags } from './utils/climateChecker';
import './App.css';

export default function App() {
  const { position, isFallback } = useGeolocation();

  const [stations, setStations] = useState([]);
  const [stationsError, setStationsError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [arrivalError, setArrivalError] = useState(null);

  // D-01: 기후동행 필터
  const [filterActive, setFilterActive] = useState(false);

  // D-02: 주변 기후동행 노선 패널
  const [climateRoutes, setClimateRoutes] = useState([]);
  const [climateStationIds, setClimateStationIds] = useState(new Set());
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState(null);

  // D-03: 경로 탐색
  const [routeSearchOpen, setRouteSearchOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routePaths, setRoutePaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [boardingTimes, setBoardingTimes] = useState([]);
  const [selectedBoardingTime, setSelectedBoardingTime] = useState(null);
  const [segmentBoardingTimes, setSegmentBoardingTimes] = useState([]);

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

  const handleStationSelect = useCallback(async (station) => {
    setSelectedStation(station);
    setArrivals([]);
    setArrivalError(null);
    setArrivalLoading(true);
    try {
      const data = await fetchArrivals(station.stationId);
      setArrivals(data);
    } catch (e) {
      setArrivalError(e.message);
    } finally {
      setArrivalLoading(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    setSelectedStation(null);
    setArrivals([]);
    setArrivalError(null);
  }, []);

  // D-03: 경로 탐색
  const handleRouteSearch = useCallback(async (start, destination) => {
    if (!position) return;
    // 모바일: route 패널 열릴 때 arrival 패널 닫기
    setSelectedStation(null);
    setArrivals([]);
    setArrivalError(null);
    setRouteLoading(true);
    setRoutePaths([]);
    setSelectedPath(null);
    setBoardingTimes([]);
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
      // 각 경로의 첫 버스 탑승 대기시간 병렬 조회
      Promise.all(tagged.map(p => fetchBoardingTime(p.subPath ?? []))).then(setBoardingTimes);
    } catch (e) {
      alert(e.message);
    } finally {
      setRouteLoading(false);
    }
  }, [position]);

  const handleSelectPath = useCallback(async (path, pathIndex) => {
    setSelectedBoardingTime(boardingTimes[pathIndex] ?? null);
    // 1. 대중교통 구간: loadLane으로 실제 도형 조회
    const withLane = await loadLaneForPath(path.info?.mapObj, path.subPath ?? []);

    // 이웃 구간의 첫/끝 좌표 추출 헬퍼
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

    // 2. 도보 구간: 이웃 대중교통 구간 끝점으로 T-Map 보행자 경로 조회 (병렬)
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
    // 구간별 실시간 버스 도착 시간 조회 (백그라운드)
    fetchSegmentBoardingTimes(finalPath.subPath).then(setSegmentBoardingTimes);
  }, [boardingTimes]);

  const handleRouteClose = useCallback(() => {
    setRouteSearchOpen(false);
    setRoutePaths([]);
    setSelectedPath(null);
    setBoardingTimes([]);
    setSelectedBoardingTime(null);
    setSegmentBoardingTimes([]);
  }, []);

  // D-01: 필터 적용
  const displayedStations = useMemo(() => {
    if (!filterActive) return stations;
    return stations.filter((s) => climateStationIds.has(s.stationId));
  }, [filterActive, stations, climateStationIds]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-icon">🚌</div>
        <div className="header-text">
          <h1>기후동행 버스 지도</h1>
          {isFallback && <p className="fallback-notice">위치 사용 불가 — 서울시청 기준</p>}
        </div>
        <button
          className={`route-search-toggle${routeSearchOpen ? ' route-search-toggle--active' : ''}`}
          onClick={() => setRouteSearchOpen((v) => !v)}
          aria-label="목적지 설정"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          목적지
        </button>
        <FilterToggle active={filterActive} onToggle={() => setFilterActive((v) => !v)} />
      </header>
      <div className="map-wrapper">
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
        {stationsError && (
          <div className="stations-error">정류장 로드 실패: {stationsError}</div>
        )}
        {routeSearchOpen && !selectedPath && (
          <RouteSearchPanel
            onSearch={handleRouteSearch}
            onClose={handleRouteClose}
            loading={routeLoading}
            currentPosition={position}
          />
        )}
        {(routePaths.length > 0 || routeLoading) && !selectedPath && (
          <RouteResultPanel
            paths={routePaths}
            loading={routeLoading}
            boardingTimes={boardingTimes}
            onSelectPath={handleSelectPath}
            selectedPath={selectedPath}
            onClose={() => { setRoutePaths([]); setSelectedPath(null); setBoardingTimes([]); }}
          />
        )}
        {selectedPath && (
          <SelectedRoutePanel
            path={selectedPath}
            boardingTime={selectedBoardingTime}
            segmentBoardingTimes={segmentBoardingTimes}
            onBack={() => setSelectedPath(null)}
            onClose={handleRouteClose}
          />
        )}
        {!routeSearchOpen && !selectedPath && routePaths.length === 0 && !selectedStation && (
          <ClimateRoutesPanel
            routes={climateRoutes}
            loading={climateLoading}
            error={climateError}
          />
        )}
        <ArrivalPanel
          station={selectedStation}
          arrivals={arrivals}
          loading={arrivalLoading}
          error={arrivalError}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
