const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const call = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

export async function logRide(routeId, routeName, stationId) {
  return call('POST', '/api/v1/rides', { routeId, routeName, stationId });
}

export async function fetchRideStats() {
  const json = await call('GET', '/api/v1/rides/stats');
  if (!json.success) throw new Error(json.error);
  return json.data;
}
