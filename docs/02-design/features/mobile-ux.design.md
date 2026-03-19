# Design: mobile-ux

> Plan 참조: `docs/01-plan/features/mobile-ux.plan.md`

## 1. 아키텍처 개요

### 레이아웃 구조 변경

**Before (현재)**:
```
┌─────────────────────────────┐
│  app-header (58px 고정)      │  ← 지도 공간 차지
├─────────────────────────────┤
│                             │
│      MapView                │  ← 나머지 공간
│                             │
│  [패널들 position:absolute]  │
└─────────────────────────────┘
```

**After (목표)**:
```
┌─────────────────────────────┐
│                             │
│      MapView (100dvh)       │
│                             │
│  ┌───────────────────────┐  │  ← floating 검색바 (top)
│  │  🚌 검색 입력창        │  │
│  └───────────────────────┘  │
│                             │
│  [FAB: GPS / Filter]        │  ← 우측 중단 floating
│                             │
│  [DraggableBottomSheet]     │  ← 하단 드래그 패널
├─────────────────────────────┤
│  [BottomTabBar]             │  ← 탭 네비게이션 (56px)
└─────────────────────────────┘
```

---

## 2. 신규 컴포넌트

### 2-1. `DraggableBottomSheet.jsx`

**경로**: `src/components/DraggableBottomSheet.jsx`

**Props**:
```js
{
  isOpen: boolean,           // 열림/닫힘 제어
  snapPoints: number[],      // [100, 0.45, 0.85] — px 또는 0~1 비율
  defaultSnap: number,       // 기본 스냅 인덱스 (0=peek, 1=half, 2=full)
  onSnapChange: (idx) => {},  // 스냅 변경 콜백
  onClose: () => {},          // 닫기 콜백 (peek 아래로 내릴 때)
  children: ReactNode,
}
```

**내부 상태**:
```js
const [snapIdx, setSnapIdx] = useState(defaultSnap);
const [dragging, setDragging] = useState(false);
const [dragY, setDragY] = useState(0);       // 현재 터치 Y 오프셋
const sheetRef = useRef();
const startYRef = useRef(0);
const startHeightRef = useRef(0);
const scrollTopRef = useRef(0);
```

**터치 이벤트 로직**:
```
onTouchStart:
  - startYRef = touch.clientY
  - startHeightRef = 현재 sheet 높이
  - scrollTopRef = 내부 스크롤 위치

onTouchMove:
  - deltaY = touch.clientY - startYRef
  - if (scrollTopRef > 0 && deltaY > 0) return  // 내부 스크롤 우선
  - setDragY(deltaY)
  - requestAnimationFrame으로 transform 적용

onTouchEnd:
  - velocity = deltaY / duration (px/ms)
  - if velocity > 0.4 (빠른 스와이프 다운):
      → peek(0) or close
  - else:
      → 현재 높이와 가장 가까운 스냅 포인트로 이동
  - spring 애니메이션 300ms
```

**CSS**:
```css
.draggable-sheet {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: var(--bg-card);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: 0 -2px 20px rgba(0,0,0,0.09);
  will-change: transform;
  touch-action: none;
  padding-bottom: var(--safe-bottom);
  transition: height 300ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* 드래그 중 transition 제거 */
.draggable-sheet--dragging {
  transition: none;
}
```

**스냅 계산**:
```js
// snapPoints 예: [100, viewportH * 0.45, viewportH * 0.85]
// height = snapPoints[snapIdx]
// transform = 없음 (height 변경 방식)
```

---

### 2-2. `BottomTabBar.jsx`

**경로**: `src/components/BottomTabBar.jsx`

**Props**:
```js
{
  activeTab: 'nearby' | 'route' | 'favorites',
  onTabChange: (tab) => {},
  hidden: boolean,  // 경로 결과/선택 중 숨김
}
```

**탭 정의**:
```js
const TABS = [
  { id: 'nearby',    label: '주변',    icon: <MapPinIcon /> },
  { id: 'route',     label: '경로',    icon: <RouteIcon /> },
  { id: 'favorites', label: '즐겨찾기', icon: <StarIcon /> },
];
```

**동작**:
- 탭 클릭 → `onTabChange(tab)` 호출
- 같은 탭 재클릭 → `onSnapChange`를 통해 peek ↔ half 토글
- `hidden=true` → `transform: translateY(100%)` 애니메이션으로 숨김

**CSS**:
```css
.bottom-tab-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: calc(56px + var(--safe-bottom));
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  display: flex;
  z-index: 200;
  padding-bottom: var(--safe-bottom);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 -1px 8px rgba(0,0,0,0.06);
}

.bottom-tab-bar--hidden {
  transform: translateY(100%);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: -0.2px;
  touch-action: manipulation;
}

.tab-item--active {
  color: var(--green-primary);
}
```

---

### 2-3. `FloatingSearchBar.jsx`

**경로**: `src/components/FloatingSearchBar.jsx`

> 기존 `HeaderSearch.jsx`를 대체

**Props**:
```js
{
  activeTab: string,
  onRouteSearch: (start, dest) => {},
  onRouteClear: () => {},
  currentPosition: { lat, lng },
  isLocked: boolean,
}
```

**모드**:
- `idle`: 단일 검색 입력창 (기존 header-search-bar 형태, 지도 위 floating)
- `route-input`: 출발지/도착지 2줄 확장 (경로 탭 클릭 시)

**위치 CSS**:
```css
.floating-search-bar {
  position: absolute;
  top: calc(var(--safe-top) + 12px);
  left: 12px;
  right: 12px;
  z-index: 100;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

---

## 3. 기존 컴포넌트 변경

### 3-1. `App.jsx`

**레이아웃 변경**:
```jsx
// Before
<div className="app">
  <header className="app-header">...</header>
  <div className="map-wrapper">...</div>
</div>

// After
<div className="app">        {/* height: 100dvh, position: relative */}
  <MapView ... />             {/* 전체 화면 */}
  <FloatingSearchBar ... />   {/* position: absolute, top */}
  <MapFab ... />              {/* position: absolute, 우측 중단 */}
  <DraggableBottomSheet ...>  {/* 탭 컨텐츠 */}
    {activeTab === 'nearby' && <ClimateRoutesPanel />}
    {activeTab === 'favorites' && <FavoritesPanel />}
    {selectedStation && <ArrivalPanelContent />}
    {routePaths.length > 0 && <RouteResultContent />}
    {selectedPath && <SelectedRoutePanelContent />}
  </DraggableBottomSheet>
  <BottomTabBar ... />
</div>
```

**신규 상태**:
```js
const [activeTab, setActiveTab] = useState('nearby');
const [sheetSnap, setSheetSnap] = useState(0); // 0=peek, 1=half, 2=full
const tabBarHidden = !!selectedPath || routePaths.length > 0;
```

**탭 변경 핸들러**:
```js
const handleTabChange = useCallback((tab) => {
  if (tab === activeTab) {
    // 같은 탭 토글: peek ↔ half
    setSheetSnap(prev => prev === 0 ? 1 : 0);
  } else {
    setActiveTab(tab);
    setSheetSnap(1); // half로 열기
  }
}, [activeTab]);
```

### 3-2. `ArrivalPanel.jsx`

- 현재: `position:absolute; bottom:0` 독립 패널
- 변경: `ArrivalPanelContent.jsx` 로 분리 (DraggableBottomSheet 내부 렌더)
- 바텀 시트 열림/닫힘은 App.jsx의 `selectedStation` 상태로 제어
- `onClose` → `setSelectedStation(null)` + `setSheetSnap(0)` (peek)

### 3-3. `RouteResultPanel.jsx` → `RouteResultContent.jsx`

- `position:absolute` 제거
- DraggableBottomSheet 내부에서 렌더
- 경로 선택 시 → `sheetSnap(0)` (peek) + `SelectedRoutePanelContent` 표시

### 3-4. `SelectedRoutePanel.jsx` → `SelectedRoutePanelContent.jsx`

- DraggableBottomSheet 내부에서 렌더
- Back 버튼 → RouteResultContent로 복귀

### 3-5. `ClimateRoutesPanel.jsx` / `FavoritesPanel.jsx`

- 독립 플로팅 패널 → DraggableBottomSheet 내부 컨텐츠로 이동
- 자체 `position:absolute` CSS 제거
- 탭 컨텐츠로 동작하므로 별도 열림/닫힘 없음

### 3-6. `FilterToggle.jsx`

- 헤더에서 → `MapFab` 영역으로 이동 (지도 우측 FAB 그룹 내)
- 기존 `filter-toggle` CSS는 `map-fab-filter` 로 재정의

---

## 4. `MapFab` 컴포넌트 (인라인 신규)

**경로**: `src/components/MapFab.jsx`

```jsx
// GPS 버튼 + 필터 버튼 세로 배치
export default function MapFab({ filterActive, onFilterToggle, onGps, tabBarVisible }) {
  return (
    <div className={`map-fab-group ${tabBarVisible ? 'map-fab-group--with-tab' : ''}`}>
      <button className="map-fab" onClick={onFilterToggle} ...>
        {/* 기후동행 필터 아이콘 */}
      </button>
      <button className="map-fab" onClick={onGps} ...>
        {/* GPS 아이콘 */}
      </button>
    </div>
  );
}
```

**CSS**:
```css
.map-fab-group {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 50;
  transition: top 0.3s, transform 0.3s;
}

/* 탭바 있을 때 탭바 위로 이동 */
.map-fab-group--with-tab {
  top: calc(50% - 28px);  /* 탭바 56px/2 = 28px */
}

.map-fab {
  width: 44px; height: 44px;
  background: var(--bg-card);
  border: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.15s, transform 0.1s;
}
.map-fab:active { transform: scale(0.92); }
```

---

## 5. 상태 흐름도

```
초기 상태
  activeTab='nearby', sheetSnap=0(peek), selectedStation=null
  → BottomTabBar 표시, FloatingSearchBar 표시
  → DraggableBottomSheet(peek): ClimateRoutesPanel 표시

[주변 탭 클릭]
  → sheetSnap=1(half), ClimateRoutesPanel 표시

[마커 클릭]
  → selectedStation = station
  → sheetSnap=1(half), ArrivalPanelContent 표시
  → BottomTabBar 유지

[즐겨찾기 탭]
  → activeTab='favorites', sheetSnap=1
  → FavoritesPanel 표시

[경로 탭 클릭]
  → FloatingSearchBar 경로 입력 모드 확장
  → sheetSnap=0 (지도 보기)

[경로 검색 실행]
  → routePaths 설정
  → sheetSnap=1(half), RouteResultContent 표시
  → BottomTabBar 숨김

[경로 선택]
  → selectedPath 설정
  → sheetSnap=0(peek), SelectedRoutePanelContent 표시
  → BottomTabBar 숨김

[경로 닫기]
  → routePaths=[], selectedPath=null
  → BottomTabBar 복귀, sheetSnap=0
```

---

## 6. 파일 변경 목록

| 파일 | 변경 유형 | 주요 내용 |
|------|----------|----------|
| `src/App.jsx` | 수정 | 레이아웃 전면 개편, 상태 추가 |
| `src/App.css` | 수정 | `.app-header` 제거, floating/tab CSS 추가 |
| `src/components/DraggableBottomSheet.jsx` | **신규** | 공용 드래그 바텀 시트 |
| `src/components/BottomTabBar.jsx` | **신규** | 하단 탭 네비게이션 |
| `src/components/FloatingSearchBar.jsx` | **신규** | 기존 HeaderSearch 대체 |
| `src/components/MapFab.jsx` | **신규** | GPS+필터 FAB 그룹 |
| `src/components/HeaderSearch.jsx` | 삭제 또는 내부 로직 재사용 |
| `src/components/ArrivalPanel.jsx` | 수정 | 독립 패널 → 컨텐츠 컴포넌트화 |
| `src/components/RouteResultPanel.jsx` | 수정 | position 제거, 컨텐츠화 |
| `src/components/SelectedRoutePanel.jsx` | 수정 | position 제거, 컨텐츠화 |
| `src/components/ClimateRoutesPanel.jsx` | 수정 | 플로팅 CSS 제거 |
| `src/components/FavoritesPanel.jsx` | 수정 | 플로팅 CSS 제거 |
| `src/components/FilterToggle.jsx` | 수정 또는 MapFab에 통합 |

---

## 7. 데스크탑(768px+) 유지 정책

모바일 개선이지만 데스크탑 레이아웃은 최대한 유지한다.

```css
@media (min-width: 768px) {
  /* 탭바 숨김 */
  .bottom-tab-bar { display: none; }

  /* 검색바: floating → 헤더 복귀 */
  .floating-search-bar {
    position: static;
    /* 기존 header 역할 */
  }

  /* 바텀 시트 → 사이드 패널 */
  .draggable-sheet {
    top: 16px; bottom: 16px;
    left: 16px; right: auto;
    width: 360px;
    border-radius: 16px;
    height: auto !important;
    max-height: none;
  }

  /* FAB: 현행 유지 */
}
```

---

## 8. 구현 순서 (Do Phase 참조)

```
Step 1: DraggableBottomSheet.jsx 구현 + 단독 테스트
Step 2: BottomTabBar.jsx 구현
Step 3: MapFab.jsx 구현
Step 4: FloatingSearchBar.jsx 구현 (HeaderSearch 로직 이식)
Step 5: App.jsx 레이아웃 전환 + 상태 연결
Step 6: ArrivalPanel → 컨텐츠화
Step 7: RouteResultPanel → 컨텐츠화
Step 8: SelectedRoutePanel → 컨텐츠화
Step 9: ClimateRoutesPanel / FavoritesPanel 플로팅 CSS 제거
Step 10: App.css 정리 (미사용 클래스 제거)
Step 11: 데스크탑 미디어 쿼리 검증
```
