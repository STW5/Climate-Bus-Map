import { useState, useEffect, useCallback, useMemo } from 'react';
import MapView from './components/MapView';
import ArrivalPanel from './components/ArrivalPanel';
import FilterToggle from './components/FilterToggle';
import ClimateRoutesPanel from './components/ClimateRoutesPanel';
import RouteSearchPanel from './components/RouteSearchPanel';
import RouteResultPanel from './components/RouteResultPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { useClimateRouteIds } from './hooks/useClimateRouteIds';
import { fetchNearbyStations, fetchArrivals, fetchNearbyClimateRoutes } from './api/busApi';
import { searchTransitRoute } from './api/odsayApi';
import { getSubPathClimateFlags } from './utils/climateChecker';
import './App.css';

export default function App() {
  const { position, isFallback } = useGeolocation();
  const { climateRouteIds } = useClimateRouteIds();

  const [stations, setStations] = useState([]);
  const [stationsError, setStationsError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [arrivalError, setArrivalError] = useState(null);

  // D-01: 기후동행 필터
  const [filterActive, setFilterActive] = useState(false);
  const [arrivalCache, setArrivalCache] = useState({});

  // D-02: 주변 기후동행 노선 패널
  const [climateRoutes, setClimateRoutes] = useState([]);
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState(null);

  // D-03: 경로 탐색
  const [routeSearchOpen, setRouteSearchOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routePaths, setRoutePaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);

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
      .then((data) => setClimateRoutes(data.routes || []))
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
      setArrivalCache((prev) => ({ ...prev, [station.stationId]: data }));
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
  const handleRouteSearch = useCallback(async (destination) => {
    if (!position) return;
    setRouteLoading(true);
    setRoutePaths([]);
    setSelectedPath(null);
    try {
      const paths = await searchTransitRoute(position, destination);
      // 각 subPath에 기후동행 여부 태깅
      const tagged = paths.map((path) => ({
        ...path,
        subPath: getSubPathClimateFlags(path.subPath ?? [], climateRouteIds),
      }));
      setRoutePaths(tagged);
    } catch (e) {
      alert(e.message);
    } finally {
      setRouteLoading(false);
    }
  }, [position, climateRouteIds]);

  const handleSelectPath = useCallback((path) => {
    setSelectedPath(path);
  }, []);

  const handleRouteClose = useCallback(() => {
    setRouteSearchOpen(false);
    setRoutePaths([]);
    setSelectedPath(null);
  }, []);

  // D-01: 필터 적용
  const displayedStations = useMemo(() => {
    if (!filterActive) return stations;
    return stations.filter((s) => {
      const cached = arrivalCache[s.stationId];
      if (!cached) return true;
      return cached.some((a) => a.climateEligible);
    });
  }, [filterActive, stations, arrivalCache]);

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
          aria-label="경로 탐색"
        >
          🗺 경로
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
        {routeSearchOpen && (
          <RouteSearchPanel
            onSearch={handleRouteSearch}
            onClose={handleRouteClose}
            loading={routeLoading}
          />
        )}
        {routePaths.length > 0 && (
          <RouteResultPanel
            paths={routePaths}
            climateRouteIds={climateRouteIds}
            onSelectPath={handleSelectPath}
            selectedPath={selectedPath}
            onClose={() => { setRoutePaths([]); setSelectedPath(null); }}
          />
        )}
        {!routeSearchOpen && (
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
