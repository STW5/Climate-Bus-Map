import { useState, useRef, useEffect } from 'react';
import { searchPlace } from '../api/tmapApi';

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
        <li key={i} className="header-suggestion-item" onMouseDown={() => onSelect(s)}>
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

export default function HeaderSearch({ onSearch, onClear, currentPosition, isLocked }) {
  const [open, setOpen] = useState(false);
  const [depQuery, setDepQuery] = useState('');
  const [depSelected, setDepSelected] = useState(null); // null = 내 위치
  const [depSuggestions, setDepSuggestions] = useState([]);
  const [depSearching, setDepSearching] = useState(false);
  const [depEditing, setDepEditing] = useState(false);

  const [destQuery, setDestQuery] = useState('');
  const [destSelected, setDestSelected] = useState(null);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destSearching, setDestSearching] = useState(false);

  const depDebounce = useRef(null);
  const destDebounce = useRef(null);
  const wrapperRef = useRef(null);

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
    onSearch(depSelected || currentPosition, place);
  };

  const handleClear = () => {
    setDepQuery(''); setDepSelected(null); setDepEditing(false);
    setDestQuery(''); setDestSelected(null);
    setDepSuggestions([]); setDestSuggestions([]);
    setOpen(false);
    onClear();
  };

  const activeSuggestions = depEditing ? depSuggestions : destSuggestions;
  const activeSearching   = depEditing ? depSearching  : destSearching;
  const handleActiveSelect = depEditing ? handleDepSelect : handleDestSelect;

  const hasValue = destQuery || destSelected;

  return (
    <div className="header-search-wrapper" ref={wrapperRef}>
      {/* 축약 상태: 포커스 전 단일 바 */}
      {!open && !isLocked && (
        <button
          className="header-search-bar"
          onClick={() => setOpen(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span className="header-search-input" style={{ color: hasValue ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: hasValue ? 500 : 400 }}>
            {destQuery || '어디로 가시나요?'}
          </span>
        </button>
      )}

      {/* 경로 안내 중 */}
      {isLocked && (
        <div className="header-search-bar header-search-bar--active">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span className="header-search-input" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            {destQuery || '경로 안내 중'}
          </span>
        </div>
      )}

      {/* 확장 상태 */}
      {open && !isLocked && (
        <div className="header-search-expanded">
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
              className="header-search-row-input"
              placeholder="목적지를 입력하세요"
              value={destQuery}
              autoFocus={!depEditing}
              onChange={e => { setDestQuery(e.target.value); setDestSelected(null); setDepEditing(false); }}
            />
            {destQuery && (
              <button className="header-search-row-clear" onClick={() => { setDestQuery(''); setDestSelected(null); }}>✕</button>
            )}
          </div>

          <button className="header-search-close" onMouseDown={() => { setOpen(false); if (!destSelected) handleClear(); }} aria-label="닫기">✕</button>
        </div>
      )}

      {/* 자동완성 드롭다운 */}
      {open && (
        <SuggestionList
          items={activeSuggestions}
          loading={activeSearching}
          onSelect={handleActiveSelect}
        />
      )}
    </div>
  );
}
