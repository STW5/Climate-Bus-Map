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
import LoginModal from './components/LoginModal';
import SavedRoutesPanel from './components/SavedRoutesPanel';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useGeolocation } from './hooks/useGeolocation';
import { fetchNearbyStations, fetchArrivals, fetchNearbyClimateRoutes, fetchBoardingTime, fetchSegmentBoardingTimes } from './api/busApi';
import { searchTransitRoute, loadLaneForPath } from './api/odsayApi';
import { getWalkingRoute } from './api/tmapApi';
import { getSubPathClimateFlags } from './utils/climateChecker';
import { getFavorites } from './utils/favorites';
import { getFavoritesForUser, migrateLocalToServer } from './api/favoritesApi';
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

function AppInner() {
  const { user, isLoggedIn, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const { position, isFallback } = useGeolocation();

  const [stations, setStations] = useState([]);
  const [stationsError, setStationsError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [arrivalError, setArrivalError] = useState(null);

  const [favorites, setFavorites] = useState(getFavorites);

  // isLoggedIn을 ref로 관리 → refreshFavorites를 stable하게 유지
  const isLoggedInRef = useRef(isLoggedIn);
  useEffect(() => { isLoggedInRef.current = isLoggedIn; }, [isLoggedIn]);

  // position을 ref로 관리 → handleRouteSearch를 stable하게 유지
  const positionRef = useRef(position);
  useEffect(() => { positionRef.current = position; }, [position]);

  const refreshFavorites = useCallback(() => {
    getFavoritesForUser(isLoggedInRef.current).then(setFavorites).catch(() => setFavorites(getFavorites()));
  }, []); // deps 없음 → stable reference, 무한렌더 방지

  // 로그인 상태 변경 시 즐겨찾기 갱신 + 첫 로그인 마이그레이션
  const prevLoggedInRef = useRef(null); // null = 초기화 전
  useEffect(() => {
    if (prevLoggedInRef.current === null) {
      // 초기 로드 완료 시 (isLoading 끝난 후)
      prevLoggedInRef.current = isLoggedIn;
      refreshFavorites();
      return;
    }
    if (isLoggedIn && !prevLoggedInRef.current) {
      // 로그인 전 → 후: 마이그레이션 후 서버 목록 로드
      migrateLocalToServer().finally(refreshFavorites);
    } else if (!isLoggedIn && prevLoggedInRef.current) {
      // 로그아웃: 로컬 목록으로 복귀
      setFavorites(getFavorites());
    }
    prevLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn, refreshFavorites]);

  const [filterActive, setFilterActive] = useState(false);

  const [climateRoutes, setClimateRoutes] = useState([]);
  const [climateStationIds, setClimateStationIds] = useState(new Set());
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateApiLimitExceeded, setClimateApiLimitExceeded] = useState(false);

  const [routeLoading, setRouteLoading] = useState(false);
  const [routePaths, setRoutePaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [boardingTimes, setBoardingTimes] = useState([]);
  const boardingTimesRef = useRef([]);
  useEffect(() => { boardingTimesRef.current = boardingTimes; }, [boardingTimes]);
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

  // ── 모바일 뒤로가기 처리 ──────────────────────────
  const selectedPathRef2 = useRef(selectedPath);
  const routePathsRef = useRef(routePaths);
  const selectedStationRef2 = useRef(selectedStation);
  useEffect(() => { selectedPathRef2.current = selectedPath; }, [selectedPath]);
  useEffect(() => { routePathsRef.current = routePaths; }, [routePaths]);
  useEffect(() => { selectedStationRef2.current = selectedStation; }, [selectedStation]);

  // 깊이 있는 뷰 진입 시 히스토리 push
  useEffect(() => {
    if (selectedPath) history.pushState({ view: 'route-detail' }, '');
  }, [selectedPath]);
  useEffect(() => {
    if (routePaths.length > 0) history.pushState({ view: 'route-list' }, '');
  }, [routePaths.length]);
  useEffect(() => {
    if (selectedStation) history.pushState({ view: 'station' }, '');
  }, [selectedStation]);

  // popstate: 브라우저 뒤로가기 → 앱 내부 이동
  useEffect(() => {
    const onPopState = () => {
      if (selectedPathRef2.current) {
        setSelectedPath(null);
        selectedPathRef.current = null;
        setSheetSnap(1);
      } else if (routePathsRef.current.length > 0) {
        setRoutePaths([]);
        setBoardingTimes([]);
        setSelectedBoardingTime(null);
        setSegmentBoardingTimes([]);
        setSheetSnap(0);
      } else if (selectedStationRef2.current) {
        setSelectedStation(null);
        setArrivals([]);
        setArrivalError(null);
        setSheetSnap(0);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // ── 가장 가까운 정류장 + 도착 정보 ──────────────────
  const nearestStation = useMemo(() => {
    if (!position || stations.length === 0) return null;
    return stations.reduce((a, b) => {
      const da = Math.hypot((a.lat - position.lat) * 111000, (a.lng - position.lng) * 88000);
      const db = Math.hypot((b.lat - position.lat) * 111000, (b.lng - position.lng) * 88000);
      return da < db ? a : b;
    });
  }, [position, stations]);

  const [nearestArrivals, setNearestArrivals] = useState([]);
  const [nearestLoading, setNearestLoading] = useState(false);

  useEffect(() => {
    if (!nearestStation) return;
    setNearestLoading(true);
    fetchArrivals(nearestStation.stationId)
      .then(data => { const t = Date.now(); setNearestArrivals(data.map(a => ({ ...a, fetchedAt: t }))); })
      .catch(() => setNearestArrivals([]))
      .finally(() => setNearestLoading(false));
  }, [nearestStation?.stationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!nearestStation) return;
    const id = setInterval(() => {
      fetchArrivals(nearestStation.stationId)
        .then(data => { const t = Date.now(); setNearestArrivals(data.map(a => ({ ...a, fetchedAt: t }))); })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [nearestStation?.stationId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    fetchNearbyClimateRoutes(position.lat, position.lng)
      .then((data) => {
        setClimateRoutes(data.routes || []);
        setClimateStationIds(new Set(data.climateStationIds || []));
        setClimateApiLimitExceeded(data.apiLimitExceeded || false);
      })
      .catch(() => {})
      .finally(() => setClimateLoading(false));
  }, [position]);

  // ── 정류장 선택 ──────────────────────────────────
  const handleStationSelect = useCallback(async (station) => {
    setSelectedStation(station);
    setArrivals([]);
    setArrivalError(null);
    setArrivalLoading(true);
    setSheetSnap(2); // full로 열기
    try {
      const data = await fetchArrivals(station.stationId);
      const fetchedAt = Date.now();
      setArrivals(data.map(a => ({ ...a, fetchedAt })));
    } catch (e) {
      setArrivalError(
        e.message === 'API_LIMIT_EXCEEDED'
          ? '오늘 버스 정보 조회 한도에 도달했습니다. 내일 자정에 초기화됩니다.'
          : e.message
      );
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
    if (!positionRef.current) return;
    setSelectedStation(null);
    setArrivals([]);
    setArrivalError(null);
    setRouteLoading(true);
    setRoutePaths([]);
    setSelectedPath(null);
    setBoardingTimes([]);
    setSheetSnap(1);
    try {
      const paths = await searchTransitRoute(start || positionRef.current, destination);
      const actualStart = start || positionRef.current;
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
  }, []); // positionRef로 최신값 참조 → stable reference

  const handleSelectPath = useCallback(async (path, pathIndex) => {
    setSelectedBoardingTime(boardingTimesRef.current[pathIndex] ?? null);
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
  }, []); // boardingTimesRef로 최신값 참조 → stable reference

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

  // nearby 탭에 보여줄 콘텐츠가 있는지 (로딩 중 / 한도초과 / 데이터 있음)
  const hasClimateContent = climateLoading || climateApiLimitExceeded || climateRoutes.length > 0;

  // 데이터 로드 완료 후 빈 상태면 시트 자동으로 peek으로 복귀
  useEffect(() => {
    if (!climateLoading && !hasClimateContent && activeTab === 'nearby' && !selectedStation && !selectedPath && routePaths.length === 0) {
      setSheetSnap(0);
    }
  }, [climateLoading, hasClimateContent, activeTab, selectedStation, selectedPath, routePaths]);

  // ── 탭 네비게이션 ──────────────────────────────
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  const hasClimateContentRef = useRef(hasClimateContent);
  useEffect(() => { hasClimateContentRef.current = hasClimateContent; }, [hasClimateContent]);

  const handleTabChange = useCallback((tab) => {
    if (tab === activeTabRef.current) {
      // 같은 탭 재클릭: peek ↔ half 토글
      setSheetSnap(prev => prev === 0 ? 1 : 0);
    } else {
      setActiveTab(tab);
      if (tab === 'route') {
        setSheetSnap(0); // 경로 탭: 지도 보이게
      } else if (tab === 'nearby') {
        setSheetSnap(hasClimateContentRef.current ? 1 : 0); // 콘텐츠 없으면 peek 유지
      } else {
        setSheetSnap(1); // favorites 등
      }
    }
  }, []); // activeTabRef, hasClimateContentRef로 최신값 참조 → stable reference

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
          isClimateStation={selectedStation ? climateStationIds.has(selectedStation.stationId) : false}
        />
      );
    }
    if (activeTab === 'favorites') {
      return (
        <FavoritesPanel
          favorites={favorites}
          onStationSelect={handleStationSelect}
          onFavoriteChange={refreshFavorites}
          onLoginRequest={() => setLoginOpen(true)}
        />
      );
    }
    if (activeTab === 'saved') {
      if (!isLoggedIn) {
        return (
          <div className="climate-routes-panel">
            <p className="favorites-empty">
              로그인하면 경로를 저장할 수 있습니다.
              <br />
              <button className="favorites-login-hint" style={{ display: 'inline', marginTop: 8 }} onClick={() => setLoginOpen(true)}>
                로그인하기
              </button>
            </p>
          </div>
        );
      }
      return <SavedRoutesPanel onRouteRestore={(detail) => { handleSelectPath(detail.routeJson, 0); }} />;
    }
    return null;
  }, [
    selectedPath, routePaths, routeLoading, selectedStation, activeTab, favorites, isLoggedIn,
    arrivals, arrivalLoading, arrivalError, climateStationIds,
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
            bottomPadding={snapPoints[sheetSnap]}
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

      {/* ── 우측 상단 로그인/프로필 버튼 ── */}
      {!tabBarHidden && !searchOpen && (
        <div className="auth-fab">
          {isLoggedIn ? (
            <button className="auth-fab__btn" onClick={logout} title={`${user?.nickname} (로그아웃)`}>
              <span className="auth-fab__avatar">{user?.nickname?.[0] ?? '?'}</span>
            </button>
          ) : (
            <button className="auth-fab__btn auth-fab__btn--login" onClick={() => setLoginOpen(true)}>
              로그인
            </button>
          )}
        </div>
      )}

      {/* ── 가장 가까운 정류장 패널 (지도 좌측 하단) ── */}
      {!tabBarHidden && !selectedStation && (
        <ClimateRoutesPanel
          station={nearestStation}
          arrivals={nearestArrivals}
          loading={nearestLoading}
          position={position}
        />
      )}

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
        hidden={(activeTab === 'nearby' && !selectedStation && !selectedPath && routePaths.length === 0 && !routeLoading)}
      >
        {sheetContent}
      </DraggableBottomSheet>

      {/* ── 하단 탭 네비게이션 ── */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hidden={tabBarHidden}
      />

      {/* ── 로그인 모달 ── */}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
