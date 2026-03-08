# Plan: Climate Bus Map — Frontend MVP

> T-Map 지도 기반 React 프론트엔드 구현 + 백엔드 연동

- **작성일**: 2026-03-07
- **레벨**: Dynamic
- **참조**: `docs/01-plan/features/climate-bus-map.plan.md` (Phase 3 항목)
- **선행 조건**: 백엔드 API 구현 완료 (`/api/v1/stations/{id}/arrivals`)

---

## 1. 목표

브라우저에서 동작하는 MVP: 지도 위에서 정류장 확인 → 도착 버스 조회 → 기후동행 가능 여부 확인

---

## 2. 핵심 기능

### F-01. 지도 화면 (T-Map SDK)

- T-Map Web SDK로 서울 지도 렌더링
- 현재 위치(GPS) 또는 기본 위치(서울시청) 중심

### F-02. 주변 정류장 마커 표시

- `/api/v1/stations/nearby` 호출 → 지도에 버스 정류장 마커
- **제약**: stationInfo API 미등록 상태 → 목 데이터로 대체 (등록 후 교체)

### F-03. 도착 버스 패널

- 마커 클릭 → `/api/v1/stations/{stationId}/arrivals` 호출
- 도착 예정 버스 목록 (노선번호, 도착 초, 기후동행 여부)

### F-04. 기후동행 배지

- `climateEligible: true` → 🟢 표시
- `climateEligible: false` → 🔴 표시

---

## 3. 제약 사항

| 제약 | 내용 | 대응 |
|------|------|------|
| stationInfo API 미등록 | `/api/v1/stations/nearby` 항상 500 반환 | 서울 주요 정류장 목 데이터 하드코딩 (5~10개) |
| 서울 버스 API 키 전파 지연 | arrivals API 에러코드 30 | API 키 활성화 대기, 개발 중 목 응답으로 테스트 |
| CORS | 프론트 → 백엔드 직접 호출 | BE에서 CORS 허용 설정 필요 |

---

## 4. 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | React (Vite) |
| 지도 | T-Map Web SDK v2 |
| HTTP | Fetch API (또는 axios) |
| 스타일 | CSS Modules 또는 Tailwind CSS |
| 빌드 | Vite |

---

## 5. 프로젝트 구조

```
Climate-Bus-Map/
├── Climate-Bus-Map-BE/     # 기존 Spring Boot
└── Climate-Bus-Map-FE/     # 신규 React (Vite)
    ├── src/
    │   ├── components/
    │   │   ├── Map.jsx           # T-Map 컴포넌트
    │   │   ├── ArrivalPanel.jsx  # 도착 정보 패널
    │   │   └── ClimateBadge.jsx  # 기후동행 배지
    │   ├── api/
    │   │   └── busApi.js         # BE API 호출
    │   └── App.jsx
    ├── index.html
    └── vite.config.js
```

---

## 6. API 연동

| 기능 | 엔드포인트 | 비고 |
|------|-----------|------|
| 주변 정류장 | `GET /api/v1/stations/nearby?lat=&lng=&radius=` | 현재 목 데이터 사용 |
| 도착 정보 | `GET /api/v1/stations/{stationId}/arrivals` | BE 구현 완료 |

---

## 7. 목 데이터 전략 (stationInfo 미등록 대응)

서울 주요 정류장 5개를 프론트엔드에 하드코딩:

```js
const MOCK_STATIONS = [
  { stationId: "111000018", stationName: "광화문·세종문화회관앞", lat: 37.5713, lng: 126.9768 },
  { stationId: "111000032", stationName: "시청앞", lat: 37.5665, lng: 126.9780 },
  { stationId: "111000158", stationName: "서울역버스환승센터", lat: 37.5546, lng: 126.9724 },
  { stationId: "111000119", stationName: "동대문역사문화공원앞", lat: 37.5659, lng: 127.0076 },
  { stationId: "111000064", stationName: "종로3가", lat: 37.5700, lng: 126.9919 },
];
```

stationInfo API 등록 후 `/api/v1/stations/nearby` 실제 호출로 교체.

---

## 8. 우선순위

| 순서 | 작업 | 완료 기준 |
|------|------|----------|
| 1 | React + Vite 프로젝트 초기화 | `npm run dev` 실행 |
| 2 | T-Map SDK 지도 렌더링 | 서울 지도 화면 표시 |
| 3 | 목 정류장 마커 표시 | 지도 위 마커 5개 표시 |
| 4 | 마커 클릭 → arrivals API 호출 | 도착 패널 표시 |
| 5 | 기후동행 배지 표시 | 🟢/🔴 배지 정상 출력 |
| 6 | BE CORS 설정 | 프론트에서 BE 호출 성공 |

---

## 9. 완료 기준 (Definition of Done)

- [ ] 브라우저에서 T-Map 지도 표시
- [ ] 지도 위 정류장 마커 클릭 가능
- [ ] 클릭 시 도착 버스 목록 + 기후동행 배지 표시
- [ ] BE API와 실제 연동 (arrivals 응답 정상 표시)

---

## 10. 다음 단계

```
/pdca design phase3
```
