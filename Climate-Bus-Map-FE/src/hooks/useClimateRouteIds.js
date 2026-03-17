import { useState, useEffect } from 'react';
import { fetchClimateEligibleRouteIds } from '../api/busApi';

/**
 * BE에서 기후동행 버스 route_id 목록을 Set으로 가져오는 훅
 */
export function useClimateRouteIds() {
  const [climateRouteIds, setClimateRouteIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchClimateEligibleRouteIds()
      .then((ids) => setClimateRouteIds(new Set(ids)))
      .catch(() => {}) // 실패해도 기능 중단 없이 빈 Set 유지
      .finally(() => setLoaded(true));
  }, []);

  return { climateRouteIds, loaded };
}
