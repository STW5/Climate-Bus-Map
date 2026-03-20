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

export async function signup(email, password, nickname) {
  const { ok, status, json } = await call('POST', '/api/v1/auth/signup', { email, password, nickname });
  if (status === 409) throw new Error('이미 사용 중인 이메일입니다.');
  if (!ok) throw new Error(json.error ?? '회원가입에 실패했습니다.');
  return json.data;
}

export async function login(email, password) {
  const { ok, json } = await call('POST', '/api/v1/auth/login', { email, password });
  if (!ok) throw new Error(json.error ?? '로그인에 실패했습니다.');
  return json.data; // { id, email, nickname }
}

export async function logout() {
  await call('POST', '/api/v1/auth/logout');
}

export async function getMe() {
  const { ok, json } = await call('GET', '/api/v1/auth/me');
  if (!ok) return null;
  return json.data; // null이면 비로그인
}

export async function refresh() {
  const { ok } = await call('POST', '/api/v1/auth/refresh');
  return ok;
}
