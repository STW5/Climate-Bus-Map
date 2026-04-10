import { useState, useRef, useEffect } from 'react';
import { searchPlace } from '../api/tmapApi';
import { getRecentSearches, addRecentSearch, removeRecentSearch } from '../utils/recentSearches';

function SuggestionList({ items, loading, onSelect }) {
  if (!loading && items.length === 0) return null;
  return (
    <ul className="header-suggestions">
      {loading && (
        <li className="header-suggestion-item header-suggestion-item--loading">
          <div className="suggestion-spinner" />검색 중...
        </li>
      )}
      {!loading && items.map((s, i) => (
        <li key={i} className="header-suggestion-item" onMouseDown={() => onSelect(s)} onTouchEnd={(e) => { e.preventDefault(); onSelect(s); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <div className="header-suggestion-text">
            <span className="header-suggestion-name">{s.name}</span>
            {s.address && <span className="header-suggestion-addr">{s.address}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * 지도 위 floating 검색바
 * forceOpen: true → 경로 탭에서 자동 확장
 * isFallback: 위치 fallback 여부 (서울시청 기준 문구)
 */
export default function FloatingSearchBar({
  forceOpen,
  onSearch,
  onClear,
  currentPosition,
  isLocked,
  isFallback,
  onOpenChange,
}) {
  const [open, setOpen] = useState(false);
  const [depQuery, setDepQuery] = useState('');
  const [depSelected, setDepSelected] = useState(null);
  const [depSuggestions, setDepSuggestions] = useState([]);
  const [depSearching, setDepSearching] = useState(false);
  const [depEditing, setDepEditing] = useState(false);

  const [destQuery, setDestQuery] = useState('');
  const [destSelected, setDestSelected] = useState(null);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destSearching, setDestSearching] = useState(false);
  const [destFocused, setDestFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);

  const depDebounce = useRef(null);
  const destDebounce = useRef(null);
  const destInputRef = useRef(null);

  // 경로 탭 → 자동 확장 (forceOpen 시에만 키보드도 열기)
  useEffect(() => {
    if (forceOpen && !open) {
      setOpen(true);
      setTimeout(() => destInputRef.current?.focus(), 50);
    }
    if (!forceOpen && open && !destSelected) {
      setOpen(false);
    }
  }, [forceOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // 부모에게 확장 상태 알림
  useEffect(() => {
    onOpenChange?.(open || !!forceOpen);
  }, [open, forceOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // 출발지 검색
  useEffect(() => {
    if (!depEditing || !depQuery.trim() || depSelected) { setDepSuggestions([]); return; }
    clearTimeout(depDebounce.current);
    depDebounce.current = setTimeout(async () => {
      setDepSearching(true);
      try { setDepSuggestions(await searchPlace(depQuery)); }
      catch { setDepSuggestions([]); }
      finally { setDepSearching(false); }
    }, 400);
  }, [depQuery, depSelected, depEditing]);

  // 목적지 검색
  useEffect(() => {
    if (!destQuery.trim() || destSelected) { setDestSuggestions([]); return; }
    clearTimeout(destDebounce.current);
    destDebounce.current = setTimeout(async () => {
      setDestSearching(true);
      try { setDestSuggestions(await searchPlace(destQuery)); }
      catch { setDestSuggestions([]); }
      finally { setDestSearching(false); }
    }, 400);
  }, [destQuery, destSelected]);

  const handleDepSelect = (place) => {
    setDepSelected(place);
    setDepQuery(place.name);
    setDepSuggestions([]);
    setDepEditing(false);
    if (destSelected) onSearch(place, destSelected);
  };

  const handleDestSelect = (place) => {
    setDestSelected(place);
    setDestQuery(place.name);
    setDestSuggestions([]);
    setDestFocused(false);
    addRecentSearch(place);
    setRecentSearches(getRecentSearches());
    onSearch(depSelected || currentPosition, place);
  };

  const handleClear = () => {
    setDepQuery(''); setDepSelected(null); setDepEditing(false);
    setDestQuery(''); setDestSelected(null);
    setDepSuggestions([]); setDestSuggestions([]);
    if (!forceOpen) setOpen(false);
    onClear();
  };

  const activeSuggestions = depEditing ? depSuggestions : destSuggestions;
  const activeSearching   = depEditing ? depSearching  : destSearching;
  const handleActiveSelect = depEditing ? handleDepSelect : handleDestSelect;

  const hasValue = destQuery || destSelected;
  const isExpanded = open || isLocked;

  return (
    <div className="floating-search-bar">
      {/* 축약 상태 */}
      {!isExpanded && (
        <button className="floating-search-collapsed" onClick={() => { setOpen(true); setTimeout(() => destInputRef.current?.focus(), 50); }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span style={{ color: hasValue ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: hasValue ? 500 : 400, fontSize: 14 }}>
            {destQuery || '어디로 가시나요?'}
          </span>
          {isFallback && <span className="fallback-notice" style={{ marginLeft: 'auto', fontSize: 10 }}>서울시청 기준</span>}
        </button>
      )}

      {/* 경로 안내 중 — 탭하면 새 검색 */}
      {isLocked && (
        <button
          className="floating-search-collapsed floating-search-collapsed--active"
          onClick={handleClear}
          aria-label="새 경로 검색"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14, flex: 1, textAlign: 'left' }}>
            {destQuery || '경로 안내 중'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>새 검색</span>
        </button>
      )}

      {/* 확장 상태 */}
      {open && !isLocked && (
        <div className="floating-search-expanded">
          {/* 출발지 행 */}
          <div className="header-search-row">
            <span className="header-search-dot header-search-dot--dep" />
            {depEditing ? (
              <input
                className="header-search-row-input"
                placeholder="출발지 검색"
                value={depQuery}
                autoFocus
                onChange={e => { setDepQuery(e.target.value); setDepSelected(null); }}
                onBlur={() => setTimeout(() => { if (!depSelected) { setDepEditing(false); setDepQuery(''); } }, 200)}
              />
            ) : (
              <button className="header-search-row-label" onClick={() => { setDepEditing(true); setDepQuery(depSelected?.name ?? ''); }}>
                {depSelected ? depSelected.name : '내 위치'}
              </button>
            )}
            {depSelected && (
              <button className="header-search-row-clear" onMouseDown={() => { setDepSelected(null); setDepQuery(''); setDepEditing(false); }}>✕</button>
            )}
          </div>

          <div className="header-search-divider" />

          {/* 목적지 행 */}
          <div className="header-search-row">
            <span className="header-search-dot header-search-dot--dest" />
            <input
              ref={destInputRef}
              className="header-search-row-input"
              placeholder="목적지를 입력하세요"
              value={destQuery}
              onChange={e => { setDestQuery(e.target.value); setDestSelected(null); setDepEditing(false); }}
              onFocus={() => setDestFocused(true)}
              onBlur={() => setTimeout(() => setDestFocused(false), 150)}
            />
            {destQuery && (
              <button className="header-search-row-clear" onClick={() => { setDestQuery(''); setDestSelected(null); }}>✕</button>
            )}
          </div>

          <button
            className="header-search-close"
            onMouseDown={() => { if (!forceOpen) setOpen(false); if (!destSelected) handleClear(); }}
            aria-label="닫기"
          >✕</button>
        </div>
      )}

      {/* 자동완성 드롭다운 */}
      {open && !isLocked && (activeSuggestions.length > 0 || activeSearching) && (
        <SuggestionList
          items={activeSuggestions}
          loading={activeSearching}
          onSelect={handleActiveSelect}
        />
      )}

      {/* 최근 검색 드롭다운 */}
      {open && !isLocked && !depEditing && destFocused && !destQuery && recentSearches.length > 0 && (
        <ul className="header-suggestions">
          <li className="header-suggestion-section">최근 검색</li>
          {recentSearches.map((s, i) => (
            <li key={i} className="header-suggestion-item" onMouseDown={() => handleDestSelect(s)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <div className="header-suggestion-text">
                <span className="header-suggestion-name">{s.name}</span>
                {s.address && <span className="header-suggestion-addr">{s.address}</span>}
              </div>
              <button
                className="header-suggestion-remove"
                onMouseDown={e => {
                  e.stopPropagation();
                  removeRecentSearch(s.name);
                  setRecentSearches(getRecentSearches());
                }}
              >✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
