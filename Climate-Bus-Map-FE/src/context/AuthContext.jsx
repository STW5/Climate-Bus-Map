import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as apiLogin, logout as apiLogout, signup as apiSignup } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = 초기화 중, null = 비로그인

  // 앱 시작 시 로그인 상태 확인
  useEffect(() => {
    getMe().then(setUser).catch(() => setUser(null));
  }, []);

  const login = useCallback(async (email, password) => {
    const userData = await apiLogin(email, password);
    setUser(userData);
    return userData;
  }, []);

  const signup = useCallback(async (username, password, nickname) => {
    const userData = await apiSignup(username, password, nickname);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoggedIn: !!user, isLoading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
