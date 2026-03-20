const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const call = (method, path, body) =>
  fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => r.json());

export async function fetchSavedRoutes() {
  const json = await call('GET', '/api/v1/saved-routes');
  return json.success ? json.data : [];
}

export async function fetchSavedRouteDetail(id) {
  const json = await call('GET', `/api/v1/saved-routes/${id}/detail`);
  if (!json.success) throw new Error(json.error);
  const data = json.data;
  return { ...data, routeJson: typeof data.routeJson === 'string' ? JSON.parse(data.routeJson) : data.routeJson };
}

export async function saveRoute(name, startName, endName, routeJson) {
  const json = await call('POST', '/api/v1/saved-routes', {
    name,
    startName,
    endName,
    routeJson: JSON.stringify(routeJson),
  });
  if (!json.success) throw new Error(json.error ?? '저장에 실패했습니다.');
  return json.data;
}

export async function deleteSavedRoute(id) {
  await call('DELETE', `/api/v1/saved-routes/${id}`);
}
