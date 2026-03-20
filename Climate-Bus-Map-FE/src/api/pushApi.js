const BASE = import.meta.env.VITE_API_BASE_URL || '';

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Push API error: ${res.status}`);
  return res.json().then(d => d.data);
}

export async function getVapidPublicKey() {
  return api('GET', '/api/v1/push/vapid-public-key').then(d => d.publicKey);
}

export async function subscribePush() {
  const registration = await navigator.serviceWorker.ready;
  const vapidKey = await getVapidPublicKey();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const { endpoint, keys } = subscription.toJSON();
  await api('POST', '/api/v1/push/subscribe', {
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });
  return subscription;
}

export async function unsubscribePush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await api('DELETE', '/api/v1/push/subscribe', { endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}

export async function getAlerts() {
  return api('GET', '/api/v1/push/alerts');
}

export async function addAlert(stationId, stationName, routeId, routeName, minutesBefore = 5) {
  return api('POST', '/api/v1/push/alerts', { stationId, stationName, routeId, routeName, minutesBefore });
}

export async function deleteAlert(id) {
  return api('DELETE', `/api/v1/push/alerts/${id}`);
}

export async function toggleAlert(id) {
  return api('PATCH', `/api/v1/push/alerts/${id}/toggle`);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
