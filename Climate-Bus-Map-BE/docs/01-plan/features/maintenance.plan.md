# climate-bus-map-maintenance Planning Document

> **Summary**: 코드 분석을 통해 발견된 보안 취약점, 성능 버그, 코드 중복 등 기술 부채 해소
>
> **Project**: Climate Bus Map (BE + FE)
> **Author**: STW5
> **Date**: 2026-04-02
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

코드 품질 분석에서 발견된 보안 취약점, 성능 버그, 코드 중복, 에러 처리 누락을 우선순위에 따라 단계적으로 수정하여 프로덕션 안정성과 유지보수성 향상

### 1.2 Background

코드 분석(2026-04-02) 결과 품질 점수 68/100. 즉시 수정이 필요한 보안 이슈 3건, 성능 버그 1건 포함.
HTTPS 환경(`climatego.duckdns.org`)에서 운영 중이므로 쿠키 보안 설정이 특히 중요.

---

## 2. 요구사항 (우선순위순)

### P1 - 즉시 수정 (보안 / 데이터 손상 위험)

| ID | 요구사항 | 대상 파일 |
|----|---------|-----------|
| FR-01 | XXE 취약점 방어 설정 추가 | `SeoulBusApiAdapter.java` |
| FR-02 | 쿠키 `Secure` 플래그 추가 (HTTPS 환경) | `AuthController.java` |
| FR-03 | `SignupRequest`, `LoginRequest` Bean Validation 추가 | `SignupRequest.java`, `LoginRequest.java` |
| FR-04 | API 키 포함 URL 로그 마스킹 | `SeoulBusApiAdapter.java:52` |
| FR-05 | `RideLogRepository` 전체 조회 → LIMIT 쿼리로 교체 | `RideLogRepository.java` |

### P2 - 단기 수정 (보안 강화 / 입력 검증)

| ID | 요구사항 | 대상 파일 |
|----|---------|-----------|
| FR-06 | `StationController.radius` 파라미터 상한 검증 | `StationController.java` |
| FR-07 | `ArrivalController.stationId` 패턴 검증 | `ArrivalController.java` |
| FR-08 | `RideController`, `PushController` Map 수신 → 전용 DTO로 교체 | `RideController.java`, `PushController.java` |
| FR-09 | Spring Profile 분리 (dev/prod) — 디버그 로그, show-sql 격리 | `application.properties` |
| FR-10 | `getNearbyClimateRoutes` 외부 API 순차→병렬 호출 | `StationService.java` |

### P3 - 중기 개선 (코드 품질)

| ID | 요구사항 | 대상 파일 |
|----|---------|-----------|
| FR-11 | FE `call()` 함수 중복 제거 → 공통 API 클라이언트 모듈 | `authApi.js`, `ridesApi.js`, `favoritesApi.js`, `savedRoutesApi.js` |
| FR-12 | BE `isClimateEligible()` 중복 제거 → 공통 유틸 | `StationService.java`, `ArrivalService.java` |
| FR-13 | `AuthController.extractCookie()` 중복 제거 → 쿠키 유틸 | `AuthController.java`, `JwtAuthFilter.java` |
| FR-14 | `App.jsx` 커스텀 훅 추출 (useArrival, useRoute, useClimateRoutes) | `App.jsx` |
| FR-15 | `GlobalExceptionHandler` 내부 에러 메시지 사용자 노출 방지 | `GlobalExceptionHandler.java` |

### P4 - 장기 개선 (테스트 / 모니터링)

| ID | 요구사항 | 대상 파일 |
|----|---------|-----------|
| FR-16 | BE 핵심 서비스 단위 테스트 추가 (UserService, ArrivalService, AlertService) | `src/test/` |
| FR-17 | 인증 관련 통합 테스트 추가 (JWT 발급/검증, 쿠키 처리) | `src/test/` |
| FR-18 | FE Vitest + React Testing Library 도입 및 기본 테스트 | `FE/src/` |

---

## 3. 구현 순서

```
P1 (보안/버그) → P2 (검증/성능) → P3 (리팩토링) → P4 (테스트)
```

각 PR은 논리적 단위로 묶어서 커밋:
- **Batch A**: FR-01~05 (P1 전체)
- **Batch B**: FR-06~09 (P2 보안/설정)
- **Batch C**: FR-10 (P2 성능)
- **Batch D**: FR-11~15 (P3 코드 품질)
- **Batch E**: FR-16~18 (P4 테스트)

---

## 4. 성공 기준

- [ ] P1 전체 수정 완료 및 테스트 통과
- [ ] 프로덕션 환경에서 Secure 쿠키 정상 동작 확인
- [ ] RideLog 조회 응답시간 개선 확인
- [ ] Spring Profile 분리 후 프로덕션 로그에 DEBUG/SQL 없음
- [ ] 코드 중복 제거 후 기능 동작 이상 없음

---

## 5. 범위 외

- ODsay/T-Map API 키 도메인 제한 설정 (외부 콘솔에서 직접 설정)
- BouncyCastle 버전 업그레이드 (별도 검토)
- Actuator/Micrometer 모니터링 도입 (별도 Feature)
- `App.jsx` 전면 리아키텍처 (점진적으로 P3에서 훅 추출만)
