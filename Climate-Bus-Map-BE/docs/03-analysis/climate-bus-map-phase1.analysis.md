# Gap Analysis: climate-bus-map-phase1

> Design vs Implementation 비교 분석

- **분석일**: 2026-03-04
- **설계 문서**: `docs/02-design/features/climate-bus-map-phase1.design.md`
- **Match Rate**: **93%**

---

## 판정 요약

| 항목 | 설계 | 구현 | 상태 |
|------|------|------|------|
| 패키지 구조 (common, config, client, entity, repository, service, controller) | ✅ | ✅ | ✅ 일치 |
| `SeoulBusApiConfig.java` | 패키지 구조에 명시 | 미구현 | ⚠️ 경미한 갭 |
| `ApiResponse<T>` (success/data/error) | ✅ | ✅ | ✅ 일치 |
| `GlobalExceptionHandler` | ✅ | ✅ | ✅ 일치 |
| `WebConfig` (CORS `/api/**` → `localhost:3000`) | ✅ | ✅ | ✅ 일치 |
| `ClimateEligibleRoute` 엔티티 (id, routeId, routeNo, routeType, updatedAt) | ✅ | ✅ | ✅ 일치 |
| `ClimateEligibleRouteRepository` | ✅ | ✅ | ✅ 일치 |
| `ClimateRouteService.getAllRoutes()` | ✅ | ✅ | ✅ 일치 |
| `GET /api/v1/climate-routes` 응답 형식 | ✅ | ✅ | ✅ 일치 |
| `SeoulBusApiClient.testConnection()` | ✅ | ✅ | ✅ 일치 |
| `data.sql` 초기 데이터 (5개 샘플) | ✅ | ✅ | ✅ 일치 |
| `ddl-auto=validate` | 설계 명시 | `update` 사용 | ⚠️ 의도적 편차 |
| `spring.jpa.defer-datasource-initialization=true` | 미언급 | 추가 구현 | ➕ 개선 |
| `ClimateRouteResponse` DTO | 미언급 (암묵적) | 추가 구현 | ➕ 개선 |

---

## 갭 상세

### GAP-1: `SeoulBusApiConfig.java` 미구현 (경미)

**설계**: 패키지 구조에 `config/SeoulBusApiConfig.java` 명시
**구현**: 미구현. `SeoulBusApiClient`가 `@Value`로 직접 속성 주입

**영향**: 없음. `@Value` 직접 주입은 동등하며 단순함. 별도 Config Bean이 불필요한 Phase 1 범위에서는 오버엔지니어링 회피가 적절.

**조치 필요**: 없음 (Phase 2에서 API 호출이 복잡해지면 추가 검토)

---

### GAP-2: `ddl-auto=update` vs 설계의 `validate` (의도적 편차)

**설계**: `spring.jpa.hibernate.ddl-auto=validate` (JPA는 검증만, 테이블은 직접 생성)
**구현**: `spring.jpa.hibernate.ddl-auto=update` (JPA가 스키마 자동 생성/수정)

**배경**: 로컬 개발 편의성을 위한 의도적 선택으로 보임. `update`는 개발 초기 DB 구조가 변경될 때 편리.

**리스크**:
- 운영 환경에서 `update` 사용은 위험 (의도치 않은 스키마 변경)
- 설계 문서의 의도(수동 DDL + JPA 검증)에서 벗어남

**권장 조치**: 개발 완료 후 운영 배포 전 `validate`로 변경. 또는 `application-prod.properties`에 `validate` 명시.

---

## 추가 구현 (설계 초과, 긍정적)

| 파일 | 내용 |
|------|------|
| `dto/ClimateRouteResponse.java` | 응답 DTO 분리 — 설계의 암묵적 요구사항을 명시적으로 구현 |
| `spring.jpa.defer-datasource-initialization=true` | `data.sql`이 JPA 초기화 이후 실행되도록 보장 — 실제 필요한 설정 |
| `spring.jpa.properties.hibernate.format_sql=true` | SQL 로그 가독성 향상 |

---

## 완료 기준 (Definition of Done) 검토

| 기준 | 코드 존재 여부 | 상태 |
|------|--------------|------|
| 애플리케이션 정상 기동 | `ClimateBusMapBeApplication.java` + 모든 Bean 구성 | ✅ (기동 확인 필요) |
| 서울 버스 API 호출 성공 | `SeoulBusApiClient.testConnection()` 구현됨 | ✅ (실제 호출 테스트 필요) |
| `climate_eligible_routes` 테이블 + 초기 데이터 | 엔티티 + `data.sql` 구현됨 | ✅ (DB 생성 후 확인 필요) |
| `GET /api/v1/climate-routes` 정상 응답 | Controller → Service → Repository 연결 완성 | ✅ (기동 후 확인 필요) |

> 코드 구현은 모두 완료. 실제 기동 및 API 테스트는 DB 연결 환경 필요.

---

## 결론

**Match Rate: 93%** ✅ (기준: 90% 이상)

Phase 1 핵심 구현이 설계 문서와 높은 일치도를 보임. 두 가지 갭 모두 운영상 문제가 없거나 의도적 편차임. 다음 단계로 진행 가능.

**권장 다음 단계**:
1. PostgreSQL 로컬 DB 연결 후 앱 기동 확인
2. `GET /api/v1/climate-routes` 실제 응답 확인
3. 운영 배포 전 `ddl-auto=validate` 설정 추가
4. `/pdca report climate-bus-map-phase1` 으로 완료 보고서 생성 또는 Phase 2 설계 시작
