# Plan: 기후동행 노선 데이터 자동 초기화

> 서울 버스 API에서 전체 시내버스 노선을 조회하여 기후동행 대상 노선만 DB에 자동으로 채우는 기능

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 문제 정의

### 배경

현재 `climate_eligible_routes` 테이블에 샘플 데이터 5개만 존재하여
대다수 버스가 "해당없음"으로 표시됨.

### 핵심 문제

- data.sql에 수백 개 노선을 수동 입력하는 건 비현실적
- 노선 변경(신설·폐지)이 생겨도 반영이 안 됨
- 정확한 기후동행 가능 여부를 사용자에게 보여줄 수 없음

### 해결 목표

> 서울 버스 API `getBusRouteList`로 서울 시내버스 전 노선을 조회하고,
> routeType 기준으로 기후동행 대상만 DB에 자동으로 저장

---

## 2. 기후동행카드 적용 범위

서울시 공식 고시 기준:

| routeType 코드 | 종류 | 기후동행 여부 |
|---------------|------|-------------|
| 3 | 간선버스 | ✅ 포함 |
| 4 | 지선버스 | ✅ 포함 |
| 5 | 순환버스 | ✅ 포함 |
| 11 | 심야버스 | ✅ 포함 |
| 6 | 광역버스 (빨간버스) | ❌ 제외 |
| 2 | 마을버스 | ❌ 제외 |
| 1 | 공항버스 | ❌ 제외 |
| 7 | 인천버스 | ❌ 제외 |
| 8 | 경기버스 | ❌ 제외 |

---

## 3. 핵심 기능

### F-01: 앱 시작 시 자동 초기화

- Spring Boot 시작 시 `climate_eligible_routes` 테이블이 비어 있으면 자동 실행
- `getBusRouteList` API 호출 → routeType 필터링 → DB 저장
- 이미 데이터가 있으면 스킵 (중복 실행 방지)

### F-02: 수동 갱신 엔드포인트 (선택)

- `POST /api/v1/admin/routes/refresh` — 노선 데이터 강제 갱신
- 노선 변경 시 재실행 가능

---

## 4. 기술 검토

### getBusRouteList API

```
GET http://ws.bus.go.kr/api/rest/busRouteInfo/getBusRouteList
  ?serviceKey={키}
  &strSrch=  (빈값 = 전체 조회)
```

응답 필드:
- `busRouteId` → route_id
- `busRouteNm` → route_no
- `routeType` → 필터링 기준

### 주의사항

- 전체 노선 수: 서울 시내버스 약 350~400개 노선
- 단건 API 호출로 전체 조회 가능 (페이지네이션 불필요)
- 기존 data.sql 샘플 5개는 초기화 후 실제 데이터로 대체됨

---

## 5. 구현 전 확인 사항

- [x] 기후동행 적용 routeType 목록 확인
- [x] getBusRouteList API 엔드포인트 확인
- [x] 기존 API 키 재사용 가능 확인 (seoul.bus.api.key)
- [ ] getBusRouteList 응답 XML 구조 실제 확인

---

## 6. 우선순위

- **높음** — 현재 "해당없음" 오표시 문제 직접 해결
- **범위**: BE 전용 (FE 변경 없음)
- **다음 단계**: `/pdca design climate-route-init`
