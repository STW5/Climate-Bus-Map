# Plan: 기후동행 필터 수정 (2026-03-17)

> 기후동행 필터 토글이 실제로 동작하지 않는 버그 수정

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: Plan

---

## 문제 원인

`App.jsx`의 `displayedStations` useMemo 로직:

```js
if (!cached) return true;  // ← 버그: 캐시 없는 정류장은 항상 표시
return cached.some((a) => a.climateEligible);
```

- `arrivalCache`는 사용자가 정류장을 클릭할 때만 채워짐
- 필터 ON 상태에서도 클릭한 적 없는 정류장은 모두 보임
- 결과적으로 필터가 거의 동작하지 않음

---

## 해결 방향

기존 `GET /api/v1/stations/nearby/climate-routes` 응답에
`climateStationIds: string[]` 필드를 추가한다.

- 이 API는 앱 로드 시 이미 호출됨 (추가 API 호출 불필요)
- BE에서 어느 정류장에 기후동행 노선이 있는지 추적 가능
- FE 필터는 이 ID 목록으로 정류장을 걸러냄

---

## 구현 범위

### BE (Spring Boot)
- `ClimateRoutesResponse.java`: `climateStationIds` 필드 추가
- `StationService.java`: 기후동행 노선 있는 stationId 수집 후 응답에 포함

### FE (React)
- `api/busApi.js`: `fetchNearbyClimateRoutes` 반환값에 `climateStationIds` 포함
- `App.jsx`:
  - `climateRoutes` 상태에서 `climateStationIds` 추출
  - `displayedStations`를 `climateStationIds` Set으로 필터링

---

## 검증 기준

- [ ] 필터 OFF: 모든 주변 정류장 마커 표시
- [ ] 필터 ON: 기후동행 노선이 있는 정류장만 마커 표시
- [ ] 정류장을 클릭한 적 없어도 필터가 올바르게 동작
- [ ] 기후동행 노선 없는 지역에서 필터 ON 시 정류장 0개 표시
