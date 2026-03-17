import { useState, useRef, useEffect } from 'react';
import { searchPlace } from '../api/tmapApi';

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function PlaceInput({ placeholder, value, onChange, onSelect, suggestions, loading, autoFocus }) {
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <input
        className="route-search-input"
        style={{ width: '100%' }}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
      />
      {(suggestions.length > 0 || loading) && (
        <ul className="route-suggestions">
          {loading && (
            <li className="route-suggestion-item route-suggestion-item--loading">
              <div className="suggestion-spinner" />
              검색 중...
            </li>
          )}
          {!loading && suggestions.map((s, i) => (
            <li key={i} className="route-suggestion-item" onClick={() => onSelect(s)}>
              <PinIcon />
              <div className="route-suggestion-text">
                <span className="route-suggestion-name">{s.name}</span>
                {s.address && <span className="route-suggestion-addr">{s.address}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RouteSearchPanel({ onSearch, onClose, loading, currentPosition }) {
  const [depEditing, setDepEditing] = useState(false);
  const [depQuery, setDepQuery] = useState('');
  const [depSelected, setDepSelected] = useState(null); // null = 내 위치
  const [depSuggestions, setDepSuggestions] = useState([]);
  const [depLoading, setDepLoading] = useState(false);

  const [destQuery, setDestQuery] = useState('');
  const [destSelected, setDestSelected] = useState(null);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destLoading, setDestLoading] = useState(false);

  const depDebounce = useRef(null);
  const destDebounce = useRef(null);

  useEffect(() => {
    if (!depEditing || !depQuery.trim() || depSelected) { setDepSuggestions([]); return; }
    clearTimeout(depDebounce.current);
    depDebounce.current = setTimeout(async () => {
      setDepLoading(true);
      try { setDepSuggestions(await searchPlace(depQuery)); }
      catch { setDepSuggestions([]); }
      finally { setDepLoading(false); }
    }, 400);
  }, [depQuery, depSelected, depEditing]);

  useEffect(() => {
    if (!destQuery.trim() || destSelected) { setDestSuggestions([]); return; }
    clearTimeout(destDebounce.current);
    destDebounce.current = setTimeout(async () => {
      setDestLoading(true);
      try { setDestSuggestions(await searchPlace(destQuery)); }
      catch { setDestSuggestions([]); }
      finally { setDestLoading(false); }
    }, 400);
  }, [destQuery, destSelected]);

  const handleDepSelect = (place) => {
    setDepSelected(place);
    setDepQuery(place.name);
    setDepSuggestions([]);
    setDepEditing(false);
  };

  const handleUseMyLocation = () => {
    setDepSelected(null);
    setDepQuery('');
    setDepSuggestions([]);
    setDepEditing(false);
  };

  const handleDestSelect = (place) => {
    setDestSelected(place);
    setDestQuery(place.name);
    setDestSuggestions([]);
  };

  const handleSwap = () => {
    const tmpSelected = depSelected;
    const tmpQuery = depQuery;
    setDepSelected(destSelected);
    setDepQuery(destQuery);
    setDestSelected(tmpSelected);
    setDestQuery(tmpQuery);
    setDepEditing(false);
    setDepSuggestions([]);
    setDestSuggestions([]);
  };

  const handleSearch = () => {
    if (!destSelected) return;
    onSearch(depSelected || currentPosition, destSelected);
  };

  return (
    <div className="route-search-panel">
      <div className="route-search-header">
        <span className="route-search-title">경로 탐색</span>
        <button className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
      </div>

      {/* 출발지 + 도착지 + 스왑 */}
      <div className="route-search-fields">
      <div className="route-search-row">
        <span className="route-dot route-dot--start" />
        <span className="route-search-label">출발</span>
        {depEditing ? (
          <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
            <PlaceInput
              placeholder="출발지 검색"
              value={depQuery}
              onChange={(e) => { setDepQuery(e.target.value); setDepSelected(null); }}
              onSelect={handleDepSelect}
              suggestions={depSuggestions}
              loading={depLoading}
              autoFocus
            />
            <button
              className="close-btn"
              onClick={handleUseMyLocation}
              aria-label="내 위치 사용"
              title="내 위치 사용"
              style={{ flexShrink: 0 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
                <circle cx="12" cy="12" r="8"/>
                <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
              </svg>
            </button>
          </div>
        ) : (
          <button
            className="route-search-field"
            style={{ flex: 1, textAlign: 'left', cursor: 'pointer', color: depSelected ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: depSelected ? 'normal' : 'italic', border: 'none', background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 14 }}
            onClick={() => { setDepQuery(depSelected?.name ?? ''); setDepEditing(true); }}
          >
            {depSelected ? depSelected.name : '내 위치'}
          </button>
        )}
      </div>

      <div className="route-search-swap-row">
        <div className="route-search-swap-line" />
        <button className="route-swap-btn" onClick={handleSwap} aria-label="출발/도착 바꾸기">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
        </button>
      </div>

      {/* 목적지 */}
      <div className="route-search-row" style={{ position: 'relative' }}>
        <span className="route-dot route-dot--end" />
        <span className="route-search-label">도착</span>
        <PlaceInput
          placeholder="목적지를 입력하세요"
          value={destQuery}
          onChange={(e) => { setDestQuery(e.target.value); setDestSelected(null); }}
          onSelect={handleDestSelect}
          suggestions={destSuggestions}
          loading={destLoading}
          autoFocus={!depEditing}
        />
      </div>
      </div>{/* end route-search-fields */}

      <button
        className={`route-search-btn${destSelected && !loading ? '' : ' route-search-btn--disabled'}`}
        onClick={handleSearch}
        disabled={!destSelected || loading}
      >
        {loading ? '경로 탐색 중...' : '기후동행 경로 탐색'}
      </button>
    </div>
  );
}
