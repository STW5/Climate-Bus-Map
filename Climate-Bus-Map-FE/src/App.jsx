import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MapView from './components/MapView';
import ArrivalPanel from './components/ArrivalPanel';
import FilterToggle from './components/FilterToggle';
import ClimateRoutesPanel from './components/ClimateRoutesPanel';
import RouteResultPanel from './components/RouteResultPanel';
import SelectedRoutePanel from './components/SelectedRoutePanel';
import { useGeolocation } from './hooks/useGeolocation';
import { fetchNearbyStations, fetchArrivals, fetchNearbyClimateRoutes, fetchBoardingTime, fetchSegmentBoardingTimes } from './api/busApi';
import { searchTransitRoute, loadLaneForPath } from './api/odsayApi';
import { getWalkingRoute, searchPlace } from './api/tmapApi';
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
  const [routeLoading, setRouteLoading] = useState(false);
  const [routePaths, setRoutePaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [boardingTimes, setBoardingTimes] = useState([]);
  const [selectedBoardingTime, setSelectedBoardingTime] = useState(null);
  const [segmentBoardingTimes, setSegmentBoardingTimes] = useState([]);
  const selectedPathRef = useRef(null);

  // 헤더 인라인 검색
  const [headerQuery, setHeaderQuery] = useState('');
  const [headerSuggestions, setHeaderSuggestions] = useState([]);
  const [headerSearching, setHeaderSearching] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(false);
  const headerDebounce = useRef(null);

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

  // 헤더 목적지 검색 디바운스
  useEffect(() => {
    if (!headerQuery.trim()) { setHeaderSuggestions([]); return; }
    clearTimeout(headerDebounce.current);
    headerDebounce.current = setTimeout(async () => {
      setHeaderSearching(true);
      try { setHeaderSuggestions(await searchPlace(headerQuery)); }
      catch { setHeaderSuggestions([]); }
      finally { setHeaderSearching(false); }
    }, 400);
  }, [headerQuery]);

  const handleStationSelect = useCallback(async (station) => {
    setSelectedStation(station);
    setArrivals([]);
    setArrivalError(null);
    setArrivalLoading(true);
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

  // 30초마다 도착 정보 재조회 (카운트다운 보정)
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
    selectedPathRef.current = finalPath;
    // 구간별 실시간 버스 도착 시간 조회 (백그라운드)
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

  const handleHeaderSelect = useCallback((place) => {
    setHeaderQuery(place.name);
    setHeaderSuggestions([]);
    setHeaderOpen(false);
    handleRouteSearch(null, place);
  }, [handleRouteSearch]);

  const handleRouteClose = useCallback(() => {
    setRoutePaths([]);
    setSelectedPath(null);
    selectedPathRef.current = null;
    setBoardingTimes([]);
    setSelectedBoardingTime(null);
    setSegmentBoardingTimes([]);
    setHeaderQuery('');
  }, []);

  // D-01: 필터 적용
  const displayedStations = useMemo(() => {
    if (!filterActive) return stations;
    return stations.filter((s) => climateStationIds.has(s.stationId));
  }, [filterActive, stations, climateStationIds]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">
          <div className="header-icon">🚌</div>
          <div>
            <span className="header-brand">ClimateGo</span>
            {isFallback && <p className="fallback-notice">서울시청 기준</p>}
          </div>
        </div>
        <div className="header-search-wrapper">
          <div className={`header-search-bar${headerOpen ? ' header-search-bar--active' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="header-search-input"
              placeholder="어디로 가시나요?"
              value={headerQuery}
              onChange={e => { setHeaderQuery(e.target.value); setHeaderOpen(true); }}
              onFocus={() => setHeaderOpen(true)}
              onBlur={() => setTimeout(() => setHeaderOpen(false), 200)}
              disabled={!!selectedPath}
            />
            {headerQuery && !selectedPath && (
              <button className="header-search-clear" onClick={() => { setHeaderQuery(''); setHeaderSuggestions([]); }} aria-label="지우기">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          {headerOpen && (headerSuggestions.length > 0 || headerSearching) && (
            <ul className="header-suggestions">
              {headerSearching && (
                <li className="header-suggestion-item header-suggestion-item--loading">
                  <div className="suggestion-spinner" />검색 중...
                </li>
              )}
              {!headerSearching && headerSuggestions.map((s, i) => (
                <li key={i} className="header-suggestion-item" onMouseDown={() => handleHeaderSelect(s)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div className="header-suggestion-text">
                    <span className="header-suggestion-name">{s.name}</span>
                    {s.address && <span className="header-suggestion-addr">{s.address}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
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
        {!selectedPath && routePaths.length === 0 && !selectedStation && (
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
