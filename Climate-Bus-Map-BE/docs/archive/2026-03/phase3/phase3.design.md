# Design: Climate Bus Map — Frontend MVP

> T-Map 지도 기반 React 프론트엔드 구현 + 백엔드 연동

- **작성일**: 2026-03-07
- **참조**: `docs/01-plan/features/phase3.plan.md`
- **기술 스택**: React 18 / Vite / T-Map Web SDK v2
- **프로젝트 경로**: `Climate-Bus-Map-FE/` (BE와 별도 폴더)

---

## 완료 기준 (Definition of Done)

- [ ] `npm run dev` → 브라우저에서 T-Map 지도 표시
- [ ] 정류장 마커 클릭 → 도착 패널 표시
- [ ] `climateEligible: true` → 🟢 / `false` → 🔴 배지 표시
- [ ] `/api/v1/stations/{stationId}/arrivals` 실제 연동

---

## 1. 프로젝트 구조

```
Climate-Bus-Map-FE/
├── public/
├── src/
│   ├── api/
│   │   └── busApi.js           # BE API 호출 함수
│   ├── components/
│   │   ├── MapView.jsx         # T-Map 지도 컨테이너
│   │   ├── StationMarker.jsx   # 정류장 마커 (T-Map Marker)
│   │   ├── ArrivalPanel.jsx    # 도착 정보 패널 (하단 슬라이드)
│   │   └── ClimateBadge.jsx    # 기후동행 가능 여부 배지
│   ├── hooks/
│   │   └── useGeolocation.js   # 현재 위치 감지
│   ├── data/
│   │   └── mockStations.js     # 목 정류장 데이터
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── .env
├── index.html
└── vite.config.js
```

---

## 2. 설정 파일

### vite.config.js

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,   // BE CORS 설정과 맞춤
  }
})
```

### .env

```
VITE_TMAP_API_KEY=mUIPLi17iw20TICBoemvj5BYm60Yn5mU3IuPf8ce
VITE_API_BASE_URL=http://localhost:8080
```

---

## 3. T-Map SDK 연동

T-Map Web SDK v2는 `index.html`에 스크립트 태그로 로드.

### index.html

```html
<script src="https://apis.openapi.sk.com/tmap/openapi/v2/map.js?version=1&appKey=YOUR_KEY"></script>
```

실제 키는 환경변수로 주입 (Vite 빌드 시 `index.html` 처리 필요하므로 직접 넣거나 컴포넌트에서 동적 로드).

### MapView.jsx — 지도 초기화 패턴

```jsx
useEffect(() => {
  const map = new Tmapv2.Map("map-container", {
    center: new Tmapv2.LatLng(37.5665, 126.9780), // 서울시청
    width: "100%",
    height: "100vh",
    zoom: 15,
  });
  mapRef.current = map;
}, []);
```

---

## 4. 컴포넌트 설계

### 4-1. App.jsx — 상태 관리 중심

```
state:
  - stations: StationDto[]      // 지도에 표시할 정류장 목록
  - selectedStation: StationDto | null   // 클릭된 정류장
  - arrivals: ArrivalDto[]      // 선택 정류장의 도착 정보
  - loading: boolean

흐름:
  mount → useGeolocation → (목 데이터 or API) stations 로드
  마커 클릭 → selectedStation 세팅 → fetchArrivals() → arrivals 갱신
```

### 4-2. MapView.jsx

- T-Map 지도 초기화
- `stations` props 받아 마커 생성
- 마커 클릭 이벤트 → `onStationSelect(station)` 콜백

### 4-3. ArrivalPanel.jsx

- `selectedStation`, `arrivals` props 수신
- 패널 슬라이드 업 (CSS transition)
- 각 arrival 항목에 `ClimateBadge` 포함

```
┌──────────────────────────────────────┐
│ 광화문·세종문화회관앞              ✕ │
├──────────────────────────────────────┤
│ 🟢 402번   2분 후 / 8분 후          │
│ 🔴 103번   3분 후 / 12분 후         │
│ 🟢 721번   5분 후 / 15분 후         │
└──────────────────────────────────────┘
```

### 4-4. ClimateBadge.jsx

```jsx
export default function ClimateBadge({ eligible }) {
  return <span>{eligible ? '🟢' : '🔴'}</span>;
}
```

### 4-5. useGeolocation.js

```js
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPosition({ lat: 37.5665, lng: 126.9780 }) // fallback: 서울시청
    );
  }, []);
  return position;
}
```

---

## 5. API 연동

### 5-1. busApi.js

```js
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchArrivals(stationId) {
  const res = await fetch(`${BASE_URL}/api/v1/stations/${stationId}/arrivals`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.arrivals;
}

export async function fetchNearbyStations(lat, lng, radius = 500) {
  // stationInfo API 미등록 → 목 데이터 반환
  const { MOCK_STATIONS } = await import('../data/mockStations.js');
  return MOCK_STATIONS;

  // stationInfo API 등록 후 아래로 교체:
  // const res = await fetch(`${BASE_URL}/api/v1/stations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  // const json = await res.json();
  // return json.data.stations;
}
```

### 5-2. mockStations.js

```js
export const MOCK_STATIONS = [
  { stationId: "111000018", stationName: "광화문·세종문화회관앞", lat: 37.5713, lng: 126.9768 },
  { stationId: "111000032", stationName: "시청앞",               lat: 37.5665, lng: 126.9780 },
  { stationId: "111000158", stationName: "서울역버스환승센터",   lat: 37.5546, lng: 126.9724 },
  { stationId: "111000119", stationName: "동대문역사문화공원앞", lat: 37.5659, lng: 127.0076 },
  { stationId: "111000064", stationName: "종로3가",              lat: 37.5700, lng: 126.9919 },
];
```

---

## 6. BE 변경사항 (최소)

### WebConfig.java — Vite 포트 확인

```java
// 현재 설정: localhost:3000
// Vite를 3000 포트로 띄우면 변경 불필요
.allowedOrigins("http://localhost:3000")
```

추가 변경 없음. BE는 이미 CORS 설정 완료.

---

## 7. 응답 타입 정의

### ArrivalDto (BE → FE)

```js
{
  routeId: "100100118",
  routeNo: "402",
  arrivalSec1: 150,    // 1번째 버스 도착 예정 초
  arrivalSec2: 660,    // 2번째 버스 도착 예정 초
  climateEligible: true
}
```

### 초 → 분 변환 유틸

```js
export function secToMin(sec) {
  if (!sec || sec <= 0) return '정보없음';
  const min = Math.floor(sec / 60);
  return min < 1 ? '곧 도착' : `${min}분 후`;
}
```

---

## 8. 구현 순서 체크리스트

```
[ ] 1. Climate-Bus-Map-FE/ Vite 프로젝트 초기화 (npm create vite)
[ ] 2. .env 파일 생성 (TMAP API 키, API_BASE_URL)
[ ] ] 3. T-Map SDK 로드 (index.html 또는 동적 로드)
[ ] 4. MapView.jsx — 지도 초기화, 기본 위치 표시
[ ] 5. useGeolocation.js — GPS 위치 감지
[ ] 6. mockStations.js + 마커 표시
[ ] 7. 마커 클릭 → ArrivalPanel 열기
[ ] 8. fetchArrivals() 연동 → 실제 BE 응답 표시
[ ] 9. ClimateBadge 배지 표시
[ ] 10. 전체 플로우 확인 (지도 → 마커 → 패널 → 배지)
```

---

## 9. 다음 단계

```
/pdca do phase3
```

---

## 10. 반응형 & 모바일 웹 (v1.3 추가)

### 10-1. HTML 메타태그

```html
<!-- viewport-fit=cover: iOS 노치·홈 바 safe area 활성화 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<!-- PWA 모바일 웹 -->
<meta name="theme-color" content="#ffffff" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="기후동행 버스" />
<meta name="mobile-web-app-capable" content="yes" />
```

### 10-2. Safe Area 변수 (CSS)

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}

/* 헤더: 노치 영역 대응 */
.app-header {
  padding-top: calc(12px + var(--safe-top));
}

/* 패널: 홈 바 영역 대응 */
.arrival-panel {
  padding-bottom: var(--safe-bottom);
}
```

### 10-3. 모바일 UX 처리

```css
body {
  overscroll-behavior: none;           /* 바운스 스크롤 방지 */
  -webkit-tap-highlight-color: transparent; /* 탭 하이라이트 제거 */
}

.app {
  height: 100dvh; /* 동적 viewport — 주소창 크기 변화 대응 */
}

.panel-body {
  -webkit-overflow-scrolling: touch;   /* iOS 관성 스크롤 */
}

.arrival-item {
  min-height: 60px; /* 터치 타겟 최소 크기 (WCAG: 44px 이상) */
}
```

### 10-4. 반응형 브레이크포인트

| 뷰포트 | 레이아웃 | 도착 패널 |
|--------|----------|-----------|
| < 768px (모바일) | 단일 컬럼 | 하단 슬라이드 업 바텀 시트 |
| ≥ 768px (태블릿) | 지도 위 플로팅 | 좌측 플로팅 카드 (340px), 좌측 슬라이드 인 |
| ≥ 1024px (데스크탑) | 지도 위 플로팅 | 좌측 플로팅 카드 (380px) |

```css
/* 태블릿/데스크탑: 바텀 시트 → 좌측 플로팅 패널 */
@media (min-width: 768px) {
  .arrival-panel {
    top: 16px; bottom: 16px;
    left: 16px; right: auto;
    width: 340px;
    border-radius: 16px;
    transform: translateX(calc(-100% - 24px)); /* 왼쪽 슬라이드 인 */
  }
  .arrival-panel.open {
    transform: translateX(0);
  }
  .drag-handle { display: none; } /* 드래그 핸들 데스크탑에서 숨김 */
}
```

### 10-5. 로딩 스피너 (CSS)

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-spinner {
  width: 22px; height: 22px;
  border: 2px solid #e0e0e0;
  border-top-color: #1a6b3a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
```

`loading-screen`(위치 로딩), `map-loading`(지도 로딩) 두 상태에서 동일한 스피너 사용.

### 10-6. 슬라이드 애니메이션 (ArrivalPanel)

```jsx
// station이 null이어도 항상 렌더링, open 클래스로 애니메이션 제어
<div className={`arrival-panel${station ? ' open' : ''}`}>
```

```css
/* 모바일: translateY(100%) → translateY(0) */
/* 데스크탑: translateX(calc(-100% - 24px)) → translateX(0) */
transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
```
