# Design: Climate Bus Map

> Plan 문서 기반 상세 설계

- **작성일**: 2026-03-04
- **참조**: `docs/01-plan/features/climate-bus-map.plan.md`
- **기술 스택**: Spring Boot 4.0.3 / Java 17 / PostgreSQL / React / Kakao Map API

---

## 1. 시스템 아키텍처

```
[브라우저 - React]
        │
        │ REST API (JSON)
        ▼
[Spring Boot Backend]
        │               │
        │               │ JPA
        ▼               ▼
[서울 버스 API]    [PostgreSQL DB]
[Kakao Map API]    (climate_eligible_routes)
```

- **Frontend**: React → Kakao Map 렌더링 + Spring Boot API 호출
- **Backend**: 서울 버스 공공 API 프록시 + 기후동행 필터링 로직
- **DB**: 기후동행 가능 노선 자체 관리 테이블만 보유 (정류장/도착정보는 실시간 API)

---

## 2. DB 스키마

### 2-1. climate_eligible_routes (기후동행 가능 노선)

```sql
CREATE TABLE climate_eligible_routes (
    id          BIGSERIAL PRIMARY KEY,
    route_id    VARCHAR(20)  NOT NULL UNIQUE,  -- 서울 버스 API 노선 ID
    route_no    VARCHAR(20)  NOT NULL,          -- 노선 번호 (예: "402")
    route_type  VARCHAR(10),                    -- 노선 유형 (간선/지선/광역 등)
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

> 기후동행 가능 여부는 공식 API 없음 → 이 테이블만 직접 관리.
> `route_id`는 서울 버스 API의 고유 노선 ID와 매핑.

---

## 3. Backend API 설계

**Base URL**: `/api/v1`

### 3-1. 주변 정류장 조회 (F-01)

```
GET /api/v1/stations/nearby
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| lat | double | Y | 위도 |
| lng | double | Y | 경도 |
| radius | int | N | 반경 (미터, 기본값 500) |

**Response**
```json
{
  "stations": [
    {
      "stationId": "100000001",
      "stationName": "광화문역",
      "lat": 37.5709,
      "lng": 126.9768,
      "distanceMeters": 120
    }
  ]
}
```

**처리 흐름**
```
Controller → StationService → 서울버스API (위경도 기반 정류소 조회) → Response 가공
```

---

### 3-2. 버스 도착 정보 조회 (F-02) + 기후동행 여부 (F-03)

```
GET /api/v1/stations/{stationId}/arrivals
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| stationId | String | Y | 정류장 ID (path variable) |

**Response**
```json
{
  "stationId": "100000001",
  "stationName": "광화문역",
  "arrivals": [
    {
      "routeId": "100100118",
      "routeNo": "402",
      "arrivalMin": 2,
      "climateEligible": true
    },
    {
      "routeId": "100100056",
      "routeNo": "201",
      "arrivalMin": 5,
      "climateEligible": false
    }
  ]
}
```

**처리 흐름**
```
Controller
  → ArrivalService.getArrivals(stationId)
      → 서울버스API 도착정보 호출
      → 각 routeId로 ClimateRouteRepository.existsByRouteId() 조회
      → climateEligible 필드 병합
  → Response 반환
```

---

### 3-3. 기후동행 가능 노선 목록 조회 (D-02 지원)

```
GET /api/v1/climate-routes
```

**Response**
```json
{
  "updatedAt": "2026-03-01T00:00:00",
  "routes": [
    { "routeId": "100100118", "routeNo": "402", "routeType": "간선" },
    { "routeId": "100100234", "routeNo": "721", "routeType": "지선" }
  ]
}
```

---

## 4. Backend 패키지 구조

```
com.stw.climatebusmapbe
├── controller
│   ├── StationController.java       # GET /stations/nearby
│   └── ArrivalController.java       # GET /stations/{id}/arrivals
├── service
│   ├── StationService.java
│   └── ArrivalService.java
├── client
│   └── SeoulBusApiClient.java       # 서울 버스 공공 API 호출
├── repository
│   └── ClimateEligibleRouteRepository.java
├── entity
│   └── ClimateEligibleRoute.java
└── dto
    ├── StationDto.java
    ├── ArrivalDto.java
    └── NearbyStationsResponse.java
```

---

## 5. Frontend 컴포넌트 구조

```
App
├── MapView                          # Kakao Map 렌더링 (메인 화면)
│   ├── CurrentLocationMarker        # 현재 위치 마커
│   └── StationMarker (x N)         # 주변 정류장 마커
│       └── StationInfoOverlay       # 마커 클릭 시 팝업
├── ArrivalPanel                     # 정류장 선택 시 우측/하단 패널
│   ├── ArrivalList                  # 도착 버스 목록
│   │   └── ArrivalItem              # 노선번호 + 도착시간 + 기후동행 뱃지
│   └── ClimateFilterToggle          # 기후동행 버스만 보기 필터 (D-01)
└── NearbyRoutesSummary              # 내 주변 이용 가능 노선 요약 (D-02)
```

---

## 6. 외부 API 연동 상세

### 6-1. 서울 열린데이터광장 API

| 기능 | API 엔드포인트 | 파라미터 |
|------|---------------|---------|
| 반경 내 정류장 조회 | `BusStopLocationXyInfoService` | tmX, tmY (GRS80 좌표계) |
| 버스 도착 정보 | `BusArrInfoService` | stId (정류장 ID) |
| 노선 기본 정보 | `BusRouteInfoService` | busRouteId |

> **주의**: 서울 버스 API 좌표계는 **GRS80 (EPSG:5174)** 사용.
> Kakao Map은 **WGS84 (위경도)** 사용 → 좌표 변환 필요.
> `proj4j` 라이브러리 사용 권장.

### 6-2. Kakao Map API (Frontend)

```javascript
// 초기화
const map = new kakao.maps.Map(container, {
  center: new kakao.maps.LatLng(lat, lng),
  level: 4
})

// 현재 위치
navigator.geolocation.getCurrentPosition(...)

// 정류장 마커
const marker = new kakao.maps.Marker({ position, map })
```

---

## 7. 환경 변수

### Backend (`application.properties`)
```properties
seoul.bus.api.key=${SEOUL_BUS_API_KEY}
seoul.bus.api.base-url=http://ws.bus.go.kr/api/rest
```

### Frontend (`.env`)
```
REACT_APP_KAKAO_MAP_KEY=your_kakao_js_key
REACT_APP_API_BASE_URL=http://localhost:8080
```

---

## 8. 구현 순서 (Do Phase 가이드)

| 순서 | 작업 | 비고 |
|------|------|------|
| 1 | `ClimateEligibleRoute` 엔티티 + 테이블 생성 | 기초 데이터 INSERT 포함 |
| 2 | `SeoulBusApiClient` 구현 (정류장 조회) | F-01 |
| 3 | `StationController` + `StationService` | F-01 |
| 4 | `SeoulBusApiClient` 확장 (도착정보 조회) | F-02 |
| 5 | `ArrivalController` + 기후동행 병합 로직 | F-02 + F-03 |
| 6 | React 프로젝트 생성 + Kakao Map 연동 | F-04 |
| 7 | `MapView` + `StationMarker` 구현 | F-04 |
| 8 | `ArrivalPanel` + `ArrivalItem` (기후동행 뱃지) | F-02 + F-03 |
| 9 | `ClimateFilterToggle` 구현 | D-01 |
| 10 | `NearbyRoutesSummary` 구현 | D-02 |

---

## 9. 주요 기술 결정

| 결정 사항 | 선택 | 이유 |
|-----------|------|------|
| 좌표 변환 위치 | Backend | 프론트 복잡도 감소 |
| 기후동행 데이터 저장 | PostgreSQL 자체 테이블 | 공식 API 없음 |
| API 캐싱 | 미적용 (MVP) | 실시간성 우선, 추후 Redis 검토 |
| CORS 처리 | Spring `@CrossOrigin` | 개발 단계 간편 처리 |
| 상태관리 (FE) | React useState/useEffect | Redux 불필요한 규모 |
