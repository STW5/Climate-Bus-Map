# Design: UX 개선

## UX-01. 내 위치로 돌아가기 버튼

### 컴포넌트 변경

**MapView.jsx**
- `onRecenterRef` prop 추가: App에서 지도 중심 이동 함수를 외부로 노출
- 또는 `recenterFn` ref를 prop으로 받아 map.setCenter + setZoom 바인딩

**App.jsx**
- `recenterRef = useRef(null)` 선언
- MapView에 `recenterRef` prop 전달
- 지도 위 우하단에 `<LocateButton onClick={recenterRef.current} />` 렌더링

**LocateButton 컴포넌트 (신규, MapView 내 또는 인라인)**
```
위치: 지도 우하단, position: absolute, bottom: 100px, right: 16px
크기: 44x44px, border-radius: 50%, background: white, box-shadow
아이콘: 조준선 SVG
```

### 동작 흐름
1. 지도 초기화 시 `recenterRef.current = () => { map.setCenter(latLng); map.setZoom(16); }`
2. GPS center 변경 시 recenterRef 내부 클로저도 최신 center 참조
3. 버튼 클릭 → recenterRef.current() 호출

---

## UX-02. 최근 검색 기록

### 유틸리티: `src/utils/recentSearches.js`
```js
const KEY = 'climatego_recent_searches';
const MAX = 5;

export function getRecentSearches() // → [{name, x, y}, ...]
export function addRecentSearch(item) // 중복 제거 후 앞에 추가, MAX 초과 시 마지막 삭제
export function clearRecentSearches()
```

### HeaderSearch.jsx 변경
- `isFocused` state 추가
- 입력창 `onFocus`: `isFocused = true`, `onBlur`: setTimeout 150ms 후 `false` (클릭 이벤트 먼저 처리)
- `query === ''` && `isFocused` 일 때 최근 검색 드롭다운 렌더링
- 검색 성공 시 `addRecentSearch(destination)` 호출
- 드롭다운 항목 클릭 → 바로 `onSearch` 호출

### 드롭다운 UI
```
위치: 검색창 바로 아래, z-index: 200
항목: 시계 아이콘 + 장소명 + X(개별 삭제) 버튼
최대 5개
```

---

## UX-03. 즐겨찾기 정류장

### 유틸리티: `src/utils/favorites.js`
```js
const KEY = 'climatego_favorites';
const MAX = 10;

export function getFavorites() // → [{stationId, stationName, lat, lng}, ...]
export function addFavorite(station)
export function removeFavorite(stationId)
export function isFavorite(stationId) // → boolean
```

### ArrivalPanel.jsx 변경
- 패널 헤더 정류장명 옆에 즐겨찾기 토글 버튼 (별 아이콘)
- `isFavorite(station.stationId)` 로 채워진/빈 별 표시
- 클릭 시 add/remove 토글

### FavoritesPanel 컴포넌트 (신규)
- `ClimateRoutesPanel` 과 같은 위치에 조건부 렌더링
- 즐겨찾기 목록 없을 때: 빈 상태 메시지 "즐겨찾기한 정류장이 없습니다"
- 목록 있을 때: 정류장명 카드 리스트, 클릭 시 `onStationSelect` 호출

### App.jsx 변경
- `favorites` state: `useState(getFavorites())`
- `handleFavoriteToggle(station)` 함수
- FavoritesPanel을 ClimateRoutesPanel 대신 탭으로 전환하거나 위에 추가

### 탭 전환 방식
하단 패널 영역에 탭 2개:
- `주변 기후동행 노선` | `즐겨찾기`
- 기본: 즐겨찾기가 있으면 즐겨찾기 탭, 없으면 기후동행 탭

---

## 파일 변경 목록

| 파일 | 변경 유형 |
|------|---------|
| `src/components/MapView.jsx` | 수정 — recenterRef prop + LocateButton |
| `src/components/HeaderSearch.jsx` | 수정 — 최근 검색 드롭다운 |
| `src/components/ArrivalPanel.jsx` | 수정 — 즐겨찾기 토글 버튼 |
| `src/components/FavoritesPanel.jsx` | 신규 — 즐겨찾기 목록 패널 |
| `src/utils/recentSearches.js` | 신규 |
| `src/utils/favorites.js` | 신규 |
| `src/App.jsx` | 수정 — recenterRef, favorites state, 탭 전환 |
| `src/App.css` | 수정 — 버튼/드롭다운/탭 스타일 |
