# Design: API 한도 초과 대응 - Stale Cache & Rate Limit 감지

- **작성일**: 2026-03-19
- **참조 Plan**: docs/01-plan/features/api-cache.plan.md

---

## 1. 구조 개요

```
요청 흐름 (정상):
Client → Controller → Service → @Cacheable(hit) → 즉시 반환
                                ↓ (miss)
                          ApiRateLimitState.isLimited()
                                ↓ (false)
                          SeoulBusApiAdapter → API 호출
                                ↓ (성공)
                          캐시 저장 → 반환

요청 흐름 (한도 초과):
SeoulBusApiAdapter → headerCd == "22" → ApiRateLimitException throw
                                              ↓
                                    ApiRateLimitState.markLimited()
                                              ↓
                          StationService catch → apiLimitExceeded: true 응답
```

---

## 2. 신규 파일

### `ApiRateLimitException.java`
```
package: com.stw.climatebusmapbe.common.exception
용도: headerCd == "22" 전용 예외
extends: RuntimeException
```

### `ApiRateLimitState.java`
```
package: com.stw.climatebusmapbe.common
용도: 오늘 한도 초과 여부를 메모리에 보관, 자정 자동 리셋
Bean: @Component (singleton)
필드:
  - AtomicBoolean limited
  - LocalDate limitedDate
메서드:
  - isLimited(): 오늘 날짜와 limitedDate 비교 → 다른 날이면 false 반환 (자정 리셋)
  - markLimited(): limited = true, limitedDate = today
```

---

## 3. 변경 파일

### `SeoulBusApiAdapter.java`
- `parseArrivals()` 내부:
  - 기존: `headerCd != "0"` → `List.of()` 반환
  - 변경: `headerCd == "22"` → `throw new ApiRateLimitException()`
  - 나머지 non-0 코드 → 기존대로 `List.of()` 반환 (결과 없음 등 정상 케이스)

### `CacheConfig.java`
| 캐시명 | 기존 TTL | 변경 TTL | 이유 |
|--------|---------|---------|------|
| nearbyClimateRoutes | 5분 | 2시간 | 노선 편성 거의 안 바뀜 |
| nearbyStations | 5분 | 10분 | 정류소 위치 거의 안 바뀜 |
| arrivals | 30초 | 30초 | 실시간 도착 정보 유지 |

### `ClimateRoutesResponse.java`
```java
// 기존 필드 유지, 추가:
private final boolean apiLimitExceeded;

// 기존 생성자 (apiLimitExceeded = false 기본값 오버로드)
public ClimateRoutesResponse(List<RouteDto> routes, int totalStations, List<String> climateStationIds) {
    this(routes, totalStations, climateStationIds, false);
}
```

### `StationService.java` — `getNearbyClimateRoutes()`
```java
// 루프 내:
try {
    List<BusArrivalDto> arrivals = busApiPort.getArrivals(stationId);
    ...
} catch (ApiRateLimitException e) {
    rateLimitState.markLimited();
    log.warn("일일 API 호출 한도 초과. 오늘 추가 조회 중단.");
    break; // 루프 즉시 종료
} catch (Exception e) {
    log.warn(...);
}

// 반환 시:
return new ClimateRoutesResponse(climateRoutes, stations.size(),
        new ArrayList<>(climateStationIds), rateLimitState.isLimited());
```

- `getArrivals()`(개별 정류소 도착 조회) 호출 전에도 `rateLimitState.isLimited()` 체크 추가
  → 한도 초과 상태에서 @Cacheable miss 발생 시 추가 API 호출 없이 빈 목록 반환

### `ArrivalController.java` / `ArrivalService.java`
- `ApiRateLimitException` catch → HTTP 429 응답 or `{"error": "API_LIMIT_EXCEEDED"}`
- FE에서 이 에러를 구분하여 안내 메시지 표시

---

## 4. Frontend 변경

### `ClimateRoutesPanel.jsx`
```jsx
// 기존: error || routes 없으면 return null
// 변경:
if (apiLimitExceeded) {
  return <div className="climate-panel__limit">
    오늘 버스 정보 조회 한도에 도달했습니다.<br/>
    내일 자정에 초기화됩니다.
  </div>
}
// routes 없으면 기존대로 null
```

### `busApi.js` — `fetchArrivals()`
```js
// 응답이 429 또는 error === "API_LIMIT_EXCEEDED" 이면
// throw new Error("API_LIMIT_EXCEEDED")
```

### `ArrivalPanel.jsx`
```jsx
// error === "API_LIMIT_EXCEEDED" 이면 별도 안내 메시지
// 기존 에러 표시 로직 재사용
```

---

## 5. API 스펙 변경

### GET /api/v1/stations/climate-routes 응답 변경
```json
// 기존
{
  "routes": [...],
  "totalStations": 8,
  "climateStationIds": [...]
}

// 변경
{
  "routes": [...],
  "totalStations": 8,
  "climateStationIds": [...],
  "apiLimitExceeded": false
}
```

### GET /api/v1/arrivals/{stationId} — 한도 초과 시
```json
HTTP 429
{
  "error": "API_LIMIT_EXCEEDED",
  "message": "일일 API 호출 한도 초과. 내일 자정에 초기화됩니다."
}
```

---

## 6. 구현 순서

1. `ApiRateLimitException` 생성
2. `ApiRateLimitState` 생성
3. `SeoulBusApiAdapter` — 코드 22 감지
4. `CacheConfig` — TTL 변경
5. `ClimateRoutesResponse` — `apiLimitExceeded` 필드
6. `StationService` — 감지 + flag 반환
7. `ArrivalController` — 429 응답
8. FE: `busApi.js`, `ClimateRoutesPanel`, `ArrivalPanel`

---

## 7. 주의사항

- `ApiRateLimitState`는 서버 재시작 시 리셋됨 (인메모리) — 재시작 후 첫 API 호출로 재감지
- `@Cacheable` hit는 한도 초과와 무관하게 정상 반환 (캐시에서 꺼내는 것은 API 호출 아님)
- 한도 초과 차단은 `getArrivals()` 직전에만 적용 — `getNearbyStations()`는 별도 한도이므로 차단 안 함
