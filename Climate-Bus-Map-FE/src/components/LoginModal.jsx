import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ onClose }) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!nickname.trim()) { setError('닉네임을 입력해 주세요.'); setLoading(false); return; }
        await signup(email, password, nickname.trim());
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-tabs">
          <button className={`modal-tab${tab === 'login' ? ' modal-tab--active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>로그인</button>
          <button className={`modal-tab${tab === 'signup' ? ' modal-tab--active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>회원가입</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <input
            className="modal-input"
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
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
            <input
              className="modal-input"
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              maxLength={20}
              autoComplete="nickname"
            />
          )}
          {error && <p className="modal-error">{error}</p>}
          <button className="modal-submit" type="submit" disabled={loading}>
            {loading ? '처리 중...' : tab === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
