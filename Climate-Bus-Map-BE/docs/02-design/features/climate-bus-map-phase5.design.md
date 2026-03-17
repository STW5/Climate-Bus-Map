# Design: 기후동행카드 최적 동선 탐색

> ODsay API로 경로를 받아 기후동행카드 사용 가능 구간을 판단하고 지도에 표시

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 진행 중

---

## 1. 아키텍처 결정

### 역할 분리

| 역할 | 담당 |
|------|------|
| 경로 탐색 | FE → ODsay API 직접 호출 |
| 버스 기후동행 판단 | FE → BE `GET /api/v1/routes/climate-eligible` |
| 지하철 기후동행 판단 | FE 하드코딩 (whitelist) |
| 경로 지도 렌더링 | FE → T-Map SDK Polyline |

BE는 `climate-eligible route ID 목록 반환` 엔드포인트 1개만 추가.

---

## 2. API 설계

### 2-1. BE 신규 엔드포인트

```
GET /api/v1/routes/climate-eligible
```

**Response:**
```json
{
  "success": true,
  "data": {
    "routeIds": ["100100069", "100100071", ...]
  }
}
```

- `ClimateEligibleRoute` 테이블 전체 조회 (이미 DB에 존재)
- Caffeine 캐시 적용 (1시간 TTL)

### 2-2. ODsay 경로탐색 API (FE 직접 호출)

```
GET https://api.odsay.com/v1/api/searchPubTransPathT
  ?SX={출발lng}&SY={출발lat}&EX={도착lng}&EY={도착lat}&apiKey={키}
```

**사용 필드:**
```
result.path[]
  ├── info.trafficType   (1=지하철+버스, 2=버스, 3=도보)
  ├── info.totalTime     (총 소요시간 분)
  └── subPath[]
        ├── trafficType  (1=지하철, 2=버스, 3=도보)
        ├── lane[].busID        ← BE climate-eligible 목록과 대조
        ├── lane[].subwayCode   ← 하드코딩 whitelist와 대조
        └── passStopList.stations[].x, .y  ← T-Map 폴리라인 좌표
```

---

## 3. 기후동행 판단 로직

### 3-1. 지하철 whitelist (하드코딩)

```js
const CLIMATE_SUBWAY_CODES = new Set([1,2,3,4,5,6,7,8,9,100,101,104,109,110]);
// 1~9호선, 경의중앙선(100), 공항철도(101), 경춘선(104), 수인분당선(109), 우이신설선(110)
// 제외: 신분당선(11), GTX
```

### 3-2. 버스 판단

```js
// BE에서 받아온 Set
const climateRouteIds = new Set(["100100069", ...]);
const isBusClimate = (busID) => climateRouteIds.has(String(busID));
```

### 3-3. 경로 전체 판단

```js
function isPathFullyClimate(subPaths, climateRouteIds) {
  return subPaths
    .filter(p => p.trafficType !== 3)  // 도보 제외
    .every(p => {
      if (p.trafficType === 1) return CLIMATE_SUBWAY_CODES.has(p.lane[0]?.subwayCode);
      if (p.trafficType === 2) return p.lane.some(l => climateRouteIds.has(String(l.busID)));
      return true;
    });
}
```

---

## 4. 컴포넌트 설계

### 4-1. 신규 파일

```
src/
├── api/
│   └── odsayApi.js             # ODsay API 호출
├── components/
│   ├── RouteSearchPanel.jsx    # 출발/도착 입력 UI
│   └── RouteResultPanel.jsx    # 경로 결과 목록
├── hooks/
│   └── useClimateRouteIds.js   # BE에서 eligible IDs 가져오기
└── utils/
    └── climateChecker.js       # 기후동행 판단 로직
```

### 4-2. RouteSearchPanel (D-03 UI)

- 화면 하단 고정 패널
- 출발지: "내 위치" 기본값, 주소 입력 가능
- 도착지: 텍스트 입력
- 검색 버튼 → `onSearch(start, end)` 콜백

### 4-3. RouteResultPanel

- 검색 결과 경로 목록 (최대 3개)
- 각 경로 카드:
  - 총 소요시간
  - 기후동행 100% 뱃지 or 일부 불가 경고
  - 구간별 아이콘 (버스/지하철/도보)
- 경로 선택 시 → MapView 폴리라인 그리기

### 4-4. MapView 폴리라인 추가

- 선택된 경로의 `stations[].x, y` 좌표를 `Tmapv2.Polyline`으로 표시
- 기후동행 가능 구간: 초록색, 불가 구간: 빨간색

---

## 5. 상태 관리 (App.jsx 추가)

```
routeSearchOpen: boolean        # 경로탐색 패널 열림/닫힘
routePaths: Path[]              # ODsay 응답 경로 목록
selectedPath: Path | null       # 지도에 표시할 경로
climateRouteIds: Set<string>    # BE에서 로드한 기후동행 버스 ID Set
```

---

## 6. BE 구현 (신규)

### ClimateRouteController 추가 엔드포인트

```java
GET /api/v1/routes/climate-eligible
→ ClimateRouteService.getAllClimateRouteIds()
→ List<String> from ClimateEligibleRouteRepository.findAll()
```

캐시 키: `"allClimateRouteIds"`, TTL 1시간

---

## 7. 구현 순서 (D-03)

1. **BE**: `GET /api/v1/routes/climate-eligible` 엔드포인트 추가
2. **FE**: `useClimateRouteIds` 훅 + `climateChecker.js` 유틸
3. **FE**: `odsayApi.js` ODsay 호출 함수
4. **FE**: `RouteSearchPanel.jsx` UI
5. **FE**: `RouteResultPanel.jsx` UI
6. **FE**: `MapView.jsx` 폴리라인 기능 추가
7. **FE**: `App.jsx` 상태 연결

---

## 8. 스코프 제외

- D-04 알림 기능 (Phase 6로 연기)
- 따릉이 구간 (ODsay 응답에 포함되면 도보 처리)
- 경로 저장/즐겨찾기
