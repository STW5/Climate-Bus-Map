import { useState, useRef, useEffect } from 'react';
import { searchPlace } from '../api/tmapApi';

export default function RouteSearchPanel({ onSearch, onClose, loading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || selected) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchPlace(query);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, [query, selected]);

  const handleSelect = (place) => {
    setSelected(place);
    setQuery(place.name);
    setSuggestions([]);
  };

  const handleSearch = () => {
    if (!selected) return;
    onSearch(selected);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setSelected(null);
  };

  return (
    <div className="route-search-panel">
      <div className="route-search-header">
        <span className="route-search-title">경로 탐색</span>
        <button className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
      </div>

      <div className="route-search-row">
        <span className="route-search-label">출발</span>
        <div className="route-search-field route-search-field--disabled">내 위치</div>
      </div>

      <div className="route-search-row" style={{ position: 'relative' }}>
        <span className="route-search-label">도착</span>
        <input
          className="route-search-input"
          type="text"
          placeholder="목적지를 입력하세요"
          value={query}
          onChange={handleInputChange}
          autoFocus
        />
        {suggestions.length > 0 && (
          <ul className="route-suggestions">
            {searchLoading && <li className="route-suggestion-item route-suggestion-item--loading">검색 중...</li>}
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="route-suggestion-item"
                onClick={() => handleSelect(s)}
              >
                <span className="route-suggestion-name">{s.name}</span>
                <span className="route-suggestion-addr">{s.address}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        className={`route-search-btn${selected ? '' : ' route-search-btn--disabled'}`}
        onClick={handleSearch}
        disabled={!selected || loading}
      >
        {loading ? '경로 탐색 중...' : '기후동행 경로 탐색'}
      </button>
    </div>
  );
}
