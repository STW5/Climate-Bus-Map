import { useState, useEffect, useCallback } from 'react';
import MapView from './components/MapView';
import ArrivalPanel from './components/ArrivalPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { fetchNearbyStations, fetchArrivals } from './api/busApi';
import './App.css';

export default function App() {
  const { position, isFallback } = useGeolocation();
  const [stations, setStations] = useState([]);
  const [stationsError, setStationsError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [arrivalError, setArrivalError] = useState(null);

  useEffect(() => {
    if (!position) return;
    setStationsError(null);
    fetchNearbyStations(position.lat, position.lng)
      .then(setStations)
      .catch((e) => setStationsError(e.message));
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>기후동행 버스 지도</h1>
        {isFallback && <span className="fallback-notice">위치 사용 불가 — 서울시청 기준</span>}
      </header>
      <div className="map-wrapper">
        {position ? (
          <MapView
            center={position}
            stations={stations}
            onStationSelect={handleStationSelect}
          />
        ) : (
          <div className="loading-screen">위치 정보를 가져오는 중...</div>
        )}
        {stationsError && (
          <div className="stations-error">정류장 로드 실패: {stationsError}</div>
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
