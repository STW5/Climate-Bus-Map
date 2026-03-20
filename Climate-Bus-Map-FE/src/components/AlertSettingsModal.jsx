import { useState, useEffect } from 'react';
import { getAlerts, addAlert, deleteAlert, toggleAlert, subscribePush } from '../api/pushApi';

function BellIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

export default function AlertSettingsModal({ station, arrivals, onClose }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [minutesBefore, setMinutesBefore] = useState(5);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  const climateArrivals = (arrivals || []).filter(a => a.climateEligible);

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (climateArrivals.length > 0 && !selectedRouteId) {
      setSelectedRouteId(climateArrivals[0].routeId);
    }
  }, [arrivals]);

  async function loadAlerts() {
    try {
      const data = await getAlerts();
      setAlerts(data || []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!selectedRouteId) return;
    setAdding(true);
    setError('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPermissionDenied(true);
        return;
      }
      await subscribePush();
      const route = climateArrivals.find(a => a.routeId === selectedRouteId);
      await addAlert(
        station.stationId,
        station.stationName,
        route.routeId,
        route.routeNo,
        minutesBefore
      );
      await loadAlerts();
    } catch (e) {
      setError(e.message || '알림 설정 중 오류가 발생했습니다.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {
      // ignore
    }
  }

  async function handleToggle(id) {
    try {
      await toggleAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
    } catch {
      // ignore
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>버스 도착 알림</h3>
          <button className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {permissionDenied && (
          <p style={{ fontSize: 13, color: '#e53e3e', marginBottom: 12 }}>
            알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해 주세요.
          </p>
        )}

        {climateArrivals.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              <strong>{station?.stationName}</strong>에서 알림 받을 노선을 선택하세요
            </p>
            <select
              className="modal-input"
              value={selectedRouteId}
              onChange={e => setSelectedRouteId(e.target.value)}
              style={{ marginBottom: 8 }}
            >
              {climateArrivals.map(a => (
                <option key={a.routeId} value={a.routeId}>{a.routeNo}번 버스</option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <select
                className="modal-input"
                value={minutesBefore}
                onChange={e => setMinutesBefore(Number(e.target.value))}
                style={{ flex: 1 }}
              >
                <option value={3}>3분 전</option>
                <option value={5}>5분 전</option>
                <option value={10}>10분 전</option>
              </select>
              <button
                className="modal-submit"
                onClick={handleAdd}
                disabled={adding || !selectedRouteId}
                style={{ flex: 1 }}
              >
                {adding ? '설정 중...' : '알림 추가'}
              </button>
            </div>
            {error && <p style={{ fontSize: 12, color: '#e53e3e', margin: 0 }}>{error}</p>}
          </div>
        )}

        {climateArrivals.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            이 정류장에는 기후동행카드 사용 가능 노선이 없습니다.
          </p>
        )}

        <div className="divider" style={{ margin: '0 0 12px' }} />
        <div className="panel-section-title">설정된 알림 ({alerts.length}/3)</div>

        {loading && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>불러오는 중...</p>}
        {!loading && alerts.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>설정된 알림이 없습니다.</p>
        )}
        {alerts.map(alert => (
          <div key={alert.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--divider)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{alert.routeName}번</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{alert.stationName} · {alert.minutesBefore}분 전</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => handleToggle(alert.id)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid var(--divider)',
                  borderRadius: 6,
                  background: alert.active ? 'var(--green-primary)' : '#f0f0f0',
                  color: alert.active ? '#fff' : 'var(--text-muted)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {alert.active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => handleDelete(alert.id)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #fca5a5',
                  borderRadius: 6,
                  background: 'transparent',
                  color: '#e53e3e',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
          * iOS 16.4+ Safari, Android Chrome 지원 · 알림은 도착 예정 시 자동 발송됩니다
        </p>
      </div>
    </div>
  );
}
