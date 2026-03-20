const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const call = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
};

export async function checkUsername(username) {
  const { ok, json } = await call('GET', `/api/v1/auth/check-username?username=${encodeURIComponent(username)}`);
  if (!ok) return false;
  return json.data; // true = 이미 사용 중
}

export async function signup(username, password, nickname) {
  const { ok, status, json } = await call('POST', '/api/v1/auth/signup', { username, password, nickname });
  if (status === 409) throw new Error('이미 사용 중인 아이디입니다.');
  if (!ok) throw new Error(json.error ?? '회원가입에 실패했습니다.');
  return json.data;
}

export async function login(username, password) {
  const { ok, json } = await call('POST', '/api/v1/auth/login', { username, password });
  if (!ok) throw new Error(json.error ?? '로그인에 실패했습니다.');
  return json.data; // { id, username, nickname }
}

export async function logout() {
  await call('POST', '/api/v1/auth/logout');
}

export async function getMe() {
  try {
    const { ok, json } = await call('GET', '/api/v1/auth/me');
    if (!ok || !json.success) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function refresh() {
  const { ok } = await call('POST', '/api/v1/auth/refresh');
  return ok;
}
