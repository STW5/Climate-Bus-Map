import { useState, useEffect, useRef } from 'react';

const DEFAULT_POSITION = { lat: 37.5665, lng: 126.9780 }; // 서울시청

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const positionRef = useRef(null);

  useEffect(() => {
    function setStable(pos) {
      // 동일 좌표면 객체 참조 유지 (불필요한 리렌더 방지)
      if (
        positionRef.current &&
        positionRef.current.lat === pos.lat &&
        positionRef.current.lng === pos.lng
      ) return;
      positionRef.current = pos;
      setPosition(pos);
    }

    if (!navigator.geolocation) {
      setStable(DEFAULT_POSITION);
      setIsFallback(true);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setStable({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setStable(DEFAULT_POSITION);
        setIsFallback(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { position, isFallback };
}
