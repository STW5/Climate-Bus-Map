# Design: Climate Bus Map — Phase 4 차별화 기능

> 실제 정류소 API 연동 + 기후동행 필터 + 주변 이용 가능 노선 패널

- **작성일**: 2026-03-09
- **참조**: `docs/01-plan/features/climate-bus-map.plan.md` (Phase 4)
- **아키텍처 참조**: `docs/02-design/architecture.design.md`
- **기술 스택**: Spring Boot 4.0.3 / Java 17 / React 18 / Vite

---

## 완료 기준 (Definition of Done)

- [ ] `GET /api/v1/stations/nearby` — 실제 공공 API 연동 (목 데이터 제거)
- [ ] FE 지도: 기후동행 필터 토글 버튼 (D-01)
- [ ] FE 지도: 필터 ON 시 기후동행 가능 버스가 오는 정류소만 표시
- [ ] `GET /api/v1/stations/nearby/climate-routes` — 주변 기후동행 가능 노선 집계 API (D-02)
- [ ] FE: 주변 기후동행 노선 목록 패널 (D-02)

---

## 선행 조건 해소: 실제 정류소 API 연동

Phase 3까지 `fetchNearbyStations()`는 목 데이터를 반환했음.
`getStaionsByPosList` API 승인 완료 (2026-03-09) → 실 API로 교체.

### 공공 API 스펙

```
GET http://ws.bus.go.kr/api/rest/stationinfo/getStationByPos
  ?serviceKey={KEY}
  &tmX={경도 WGS84}   ← lng
  &tmY={위도 WGS84}   ← lat
  &radius={반경 m, 0~1500}
  &resultType=json

응답 필드:
  stationId  정류소 고유 ID
  stationNm  정류소명
  gpsX       경도
  gpsY       위도
  arsId      정류소 고유번호
  dist       거리(m)
```

> 응답 필드명 주의: 기존 `stId/stNm/tmX/tmY` 아님 → `stationId/stationNm/gpsX/gpsY`

---

## 1. BE 변경 사항

### 1-1. SeoulBusApiAdapter — getNearbyStations() 추가

`BusApiPort` 인터페이스에 메서드 추가, `SeoulBusApiAdapter`에서 구현.

```
BusApiPort
  + getNearbyStations(lng, lat, radius): List<NearbyStationDto>

SeoulBusApiAdapter
  + getNearbyStations(): getStationByPos 호출 → XML 파싱 → List<NearbyStationDto>
```

**NearbyStationDto 필드 변경**:
```
현재: stationId, stationName, lat, lng
변경: stationId, stationName, lat, lng (동일, 내부 파싱 로직만 교체)
```

### 1-2. StationService — 목 데이터 → 실 API

```java
// Before (목 데이터 throw)
throw new BusApiException("미등록 상태...");

// After
List<NearbyStationDto> stations = busApiPort.getNearbyStations(lng, lat, radius);
return new NearbyStationsResponse(stations);
```

캐싱: `@Cacheable(value = "nearbyStations", key = "#lat + '_' + #lng + '_' + #radius")`

### 1-3. 새 엔드포인트: 주변 기후동행 가능 노선 집계 (D-02)

```
GET /api/v1/stations/nearby/climate-routes?lat=&lng=&radius=

동작:
  1. getStationByPos → 주변 정류소 목록
  2. 각 정류소별 getLowArrInfoByStId → 도착 버스 목록
  3. climateEligible=true 인 노선만 추출 (중복 제거)
  4. 응답 반환

응답:
{
  "success": true,
  "data": {
    "routes": [
      { "routeId": "100100118", "routeNo": "402", "routeType": "간선" }
    ],
    "stationCount": 5
  }
}
```

> 주의: 정류소 수만큼 도착정보 API 호출 → 일일 트래픽 관리 필요 (반경 500m 기준 평균 5~10개 정류소)

---

## 2. FE 변경 사항

### 2-1. fetchNearbyStations 목 데이터 제거

```js
// src/api/busApi.js
export async function fetchNearbyStations(lat, lng, radius = 500) {
  const res = await fetch(`${BASE_URL}/api/v1/stations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.stations;
}
```

### 2-2. D-01: 기후동행 필터 토글

**위치**: 지도 상단 고정 버튼

**동작**:
- 필터 OFF (기본): 주변 모든 정류소 마커 표시
- 필터 ON: 기후동행 가능 버스가 오는 정류소만 표시

**판단 방법**: 각 정류소의 arrivals를 이미 로드한 경우 `climateEligible=true` 데이터 기준으로 필터링. 미로드 정류소는 마커 유지 (lazy 방식).

**UI 스펙**:
```
[🌱 기후동행 필터] 버튼 — 지도 상단 중앙
  - 비활성: 회색 배경, "전체 정류소"
  - 활성: 초록 배경, "기후동행 가능만"
```

**컴포넌트**: `FilterToggle.jsx` 신규 생성

### 2-3. D-02: 주변 기후동행 노선 패널

**위치**: 지도 좌측 하단 (모바일: 하단 시트)

**동작**: 지도 로드 시 현재 위치 기반으로 `/api/v1/stations/nearby/climate-routes` 호출 → 이용 가능 노선 목록 표시

**UI 스펙**:
```
┌──────────────────────┐
│ 내 주변 기후동행 노선  │
├──────────────────────┤
│ 🟢 402 (간선)        │
│ 🟢 721 (지선)        │
│ 🟢 201 (간선)        │
└──────────────────────┘
```

**컴포넌트**: `ClimateRoutesPanel.jsx` 신규 생성

---

## 3. 구현 순서

```
1. BE: BusApiPort + SeoulBusApiAdapter에 getNearbyStations() 구현
2. BE: StationService 목 데이터 → 실 API 교체
3. BE: /nearby/climate-routes 엔드포인트 추가
4. FE: fetchNearbyStations() 실 API 전환
5. FE: FilterToggle 컴포넌트 + 필터 로직
6. FE: ClimateRoutesPanel 컴포넌트
7. 통합 테스트
```

---

## 4. 영향 범위

| 파일 | 변경 유형 |
|------|----------|
| `SeoulBusApiAdapter.java` | 메서드 추가 (`getNearbyStations`) |
| `BusApiPort.java` | 인터페이스 메서드 추가 |
| `StationService.java` | 목 데이터 → 실 API |
| `StationController.java` | 엔드포인트 추가 (`/nearby/climate-routes`) |
| `NearbyStationsResponse.java` | 기존 유지 |
| `src/api/busApi.js` | 주석 해제 |
| `src/components/FilterToggle.jsx` | 신규 |
| `src/components/ClimateRoutesPanel.jsx` | 신규 |
| `src/App.jsx` | 필터 상태 관리 추가 |
