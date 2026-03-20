import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkUsername } from '../api/authApi';

export default function LoginModal({ onClose }) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 아이디 중복체크
  const [usernameStatus, setUsernameStatus] = useState('idle'); // 'idle' | 'checking' | 'taken' | 'available'
  const checkTimerRef = useRef(null);

  useEffect(() => {
    if (tab !== 'signup' || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    clearTimeout(checkTimerRef.current);
    checkTimerRef.current = setTimeout(async () => {
      const taken = await checkUsername(username);
      setUsernameStatus(taken ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(checkTimerRef.current);
  }, [username, tab]);

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setUsernameStatus('idle');
    setUsername('');
    setPassword('');
    setPasswordConfirm('');
    setNickname('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'signup') {
      if (username.length < 3) { setError('아이디는 3자 이상이어야 합니다.'); return; }
      if (usernameStatus === 'taken') { setError('이미 사용 중인 아이디입니다.'); return; }
      if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return; }
      if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
      if (!nickname.trim()) { setError('닉네임을 입력해 주세요.'); return; }
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(username, password);
      } else {
        await signup(username, password, nickname.trim());
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const usernameHint = () => {
    if (tab !== 'signup' || username.length < 3) return null;
    if (usernameStatus === 'checking') return <span className="username-hint checking">확인 중...</span>;
    if (usernameStatus === 'taken') return <span className="username-hint taken">이미 사용 중인 아이디예요</span>;
    if (usernameStatus === 'available') return <span className="username-hint available">사용 가능한 아이디예요</span>;
    return null;
  };

  const pwMatch = tab === 'signup' && passwordConfirm.length > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-tabs">
          <button className={`modal-tab${tab === 'login' ? ' modal-tab--active' : ''}`} onClick={() => switchTab('login')}>로그인</button>
          <button className={`modal-tab${tab === 'signup' ? ' modal-tab--active' : ''}`} onClick={() => switchTab('signup')}>회원가입</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-input-wrap">
            <input
              className="modal-input"
              type="text"
              placeholder="아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
            />
            {usernameHint()}
          </div>

          <input
            className="modal-input"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />

          {tab === 'signup' && (
            <>
              <div className="modal-input-wrap">
                <input
                  className={`modal-input${pwMatch ? (password === passwordConfirm ? ' input--ok' : ' input--err') : ''}`}
                  type="password"
                  placeholder="비밀번호 확인"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {pwMatch && (
                  <span className={`username-hint ${password === passwordConfirm ? 'available' : 'taken'}`}>
                    {password === passwordConfirm ? '비밀번호가 일치해요' : '비밀번호가 일치하지 않아요'}
                  </span>
                )}
              </div>
              <input
                className="modal-input"
                type="text"
                placeholder="닉네임 (화면에 표시될 이름)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                maxLength={20}
                autoComplete="nickname"
              />
            </>
          )}

          {error && <p className="modal-error">{error}</p>}
          <button className="modal-submit" type="submit" disabled={loading || (tab === 'signup' && usernameStatus === 'taken')}>
            {loading ? '처리 중...' : tab === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
