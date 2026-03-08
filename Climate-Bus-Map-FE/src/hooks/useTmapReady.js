import { useState, useEffect } from 'react';

export function useTmapReady() {
  const [ready, setReady] = useState(!!window.Tmapv2);

  useEffect(() => {
    if (window.Tmapv2) {
      setReady(true);
      return;
    }

    const apiKey = import.meta.env.VITE_TMAP_API_KEY;
    const script = document.createElement('script');
    script.src = `https://apis.openapi.sk.com/tmap/openapi/v2/map.js?version=1&appKey=${apiKey}`;
    script.onload = () => setReady(true);
    script.onerror = () => console.error('T-Map SDK 로드 실패');
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return ready;
}
