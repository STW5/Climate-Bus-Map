const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchNearbyStations(lat, lng, radius = 500) {
  const res = await fetch(`${BASE_URL}/api/v1/stations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.stations;
}

export async function fetchArrivals(stationId) {
  const res = await fetch(`${BASE_URL}/api/v1/stations/${stationId}/arrivals`);
  if (!res.ok) throw new Error(`서버 오류 (HTTP ${res.status})`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.arrivals;
}

export async function fetchNearbyClimateRoutes(lat, lng, radius = 500) {
  const res = await fetch(`${BASE_URL}/api/v1/stations/nearby/climate-routes?lat=${lat}&lng=${lng}&radius=${radius}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export async function fetchClimateEligibleRouteIds() {
  const res = await fetch(`${BASE_URL}/api/v1/routes/climate-eligible`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.routeIds;
}
