# Plan: API 한도 초과 대응 - Stale Cache & Rate Limit 감지

> 서울 버스 API 일일 호출 한도 소진 시 서비스 중단 없이 graceful degradation

- **작성일**: 2026-03-19
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 문제 정의

### 현재 증상
- 서울 버스 API (data.go.kr) 일일 호출 한도 소진 시 `headerCd == "22"` 응답
- `parseArrivals()` → 코드 22 → 그냥 `List.of()` 반환 (에러 감지 안 됨)
- `StationService` → 전체 정류소 순회 → 모두 빈 목록 → 기후동행 노선 0개
- `ClimateRoutesPanel` → routes 빈 배열 → `return null` → 사용자는 패널 자체가 사라짐
- 사용자 입장: "앱이 고장났나?" — 원인 전혀 모름

### 근본 원인
1. **TTL이 짧아 캐시 miss가 자주 발생** — nearbyClimateRoutes 5분, arrivals 30초
2. **한도 초과 감지 없음** — 22 코드를 정상 응답(빈 목록)으로 처리
3. **fallback 없음** — 캐시 miss + API 에러 시 빈 응답 그대로 반환

---

## 2. 해결 전략

### 전략: TTL 연장 + Rate Limit 감지 + Graceful Fallback

복잡한 Background Job이나 이중 캐시 대신, 가장 위험 부담 없는 3계층 접근:

**Layer 1 — 애초에 API를 덜 호출하도록 (TTL 연장)**
- `nearbyClimateRoutes`: 5분 → 2시간
  - 버스 노선 편성은 분 단위로 안 바뀜, 같은 위치 재방문 사용자 커버
- `nearbyStations`: 5분 → 10분
  - 정류소 위치는 거의 변하지 않음
- `arrivals` TTL은 30초 유지 (실시간 도착 정보)

**Layer 2 — 한도 초과를 정확히 감지**
- `parseArrivals()` 코드 22 → `ApiRateLimitException` throw
- `ApiRateLimitState` 빈 (singleton): `AtomicBoolean` + `LocalDate`로 오늘 한도 초과 여부 관리
- 자정(다음 날)이 되면 자동 리셋
- 한도 초과 감지 시 이후 API 호출 자체를 차단 (당일 추가 소진 방지)

**Layer 3 — 사용자에게 이유 전달**
- `ClimateRoutesResponse`에 `apiLimitExceeded: boolean` 필드 추가
- `ClimateRoutesPanel`: 한도 초과면 "오늘 버스 정보 조회 한도에 도달했습니다. 내일 자정에 초기화됩니다" 안내
- 도착 정보도 동일: 한도 초과 시 ArrivalPanel에 같은 메시지

---

## 3. 구현 범위

### Backend (Spring Boot)
1. `ApiRateLimitException.java` — 새 예외 클래스
2. `ApiRateLimitState.java` — 한도 초과 상태 관리 빈 (자정 리셋)
3. `SeoulBusApiAdapter.java` — `headerCd == "22"` 감지 → `ApiRateLimitException` throw
4. `CacheConfig.java` — nearbyClimateRoutes TTL 2시간, nearbyStations TTL 10분으로 변경
5. `ClimateRoutesResponse.java` — `apiLimitExceeded` 필드 추가
6. `StationService.java` — 한도 초과 감지 시 flag 설정 + 루프 조기 종료
7. `ArrivalController.java` — `ApiRateLimitException` → 409 응답 (또는 빈 응답 + 에러코드)

### Frontend (React)
8. `ClimateRoutesPanel.jsx` — `apiLimitExceeded` 안내 메시지
9. `ArrivalPanel.jsx` — arrival error 시 한도 초과 안내 (기존 `error` prop 활용)
10. `busApi.js` — arrival 에러 응답에서 limit 에러 구분

---

## 4. 범위 외 (별도 feature)

- Background Job으로 사전 캐싱 (서울 전역 좌표 순회)
- 여러 API 키 로테이션
- Redis 분산 캐시 (현재 인메모리 Caffeine 유지)

---

## 5. 리스크

| 항목 | 리스크 | 대응 |
|------|--------|------|
| TTL 연장 | 오래된 노선 정보 노출 가능 | 버스 노선은 일 단위 변경 → 2시간 허용 범위 |
| ApiRateLimitState | 서버 재시작 시 상태 초기화 | 재시작 후 첫 API 호출로 자동 재감지됨 |
| Cacheable + 조기 차단 | 캐시 hit는 그대로 작동 | 차단은 실제 API 호출 직전에만 적용 |
