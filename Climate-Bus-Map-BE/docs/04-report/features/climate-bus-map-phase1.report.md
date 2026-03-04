# Completion Report: climate-bus-map-phase1

> Phase 1 기반 구축 — PDCA 완료 보고서

- **작성일**: 2026-03-04
- **Phase**: Phase 1 (Foundation)
- **Match Rate**: 93% ✅
- **상태**: 완료 (Completed)

---

## 1. 개요

### 목표

서울 버스 공공 API 연동 검증, DB 스키마 구성, Spring Boot 프로젝트 뼈대 완성.
전체 프로젝트(Climate Bus Map)의 Phase 1 — 이후 Phase 2 (MVP Backend)의 기반이 되는 단계.

### 달성 결과

| 항목 | 목표 | 결과 |
|------|------|------|
| Spring Boot 프로젝트 구조 설계 및 구현 | BE-01 | ✅ 완료 |
| 서울 버스 API 클라이언트 구현 | BE-02 | ✅ 완료 |
| `climate_eligible_routes` 테이블 스키마 + 초기 데이터 | BE-03 | ✅ 완료 |
| `GET /api/v1/climate-routes` 엔드포인트 | 설계 명세 | ✅ 완료 |
| 공통 응답 포맷 (`ApiResponse<T>`) | 설계 명세 | ✅ 완료 |
| CORS 설정 (프론트 연동 준비) | 설계 명세 | ✅ 완료 |

---

## 2. Plan → Design → Do → Check 요약

### Plan (계획)
- **문서**: `docs/01-plan/features/climate-bus-map.plan.md`
- **핵심 결정**: 전체 서비스를 5개 Phase로 분리. Phase 1은 API 연동 검증 + DB 뼈대에 집중.
- **기술 스택 확정**: Spring Boot 4.0.3 / Java 17 / PostgreSQL / Gradle

### Design (설계)
- **문서**: `docs/02-design/features/climate-bus-map-phase1.design.md`
- **핵심 결정**:
  - 패키지 구조 7개 레이어 정의 (common, config, client, entity, repository, service, controller)
  - 공통 응답 포맷 `{ success, data, error }` 통일
  - `climate_eligible_routes` 테이블 컬럼 설계 (route_id, route_no, route_type, updated_at)
  - `ddl-auto=validate` + 수동 DDL 방식 채택

### Do (구현)
- **구현 파일**: 총 10개 Java 파일 + 2개 리소스 파일

| 파일 | 역할 |
|------|------|
| `common/ApiResponse.java` | 공통 응답 래퍼 (`success`, `data`, `error`) |
| `common/GlobalExceptionHandler.java` | 전역 예외 처리 (400, 500) |
| `config/WebConfig.java` | CORS 설정 (`/api/**` → `localhost:3000`) |
| `client/SeoulBusApiClient.java` | 서울 버스 API HTTP 클라이언트 (testConnection) |
| `entity/ClimateEligibleRoute.java` | JPA 엔티티 (4개 컬럼) |
| `repository/ClimateEligibleRouteRepository.java` | JPA Repository |
| `dto/ClimateRouteResponse.java` | 응답 DTO (updatedAt + routes 리스트) |
| `service/ClimateRouteService.java` | 노선 목록 조회 + 최신 updatedAt 계산 |
| `controller/ClimateRouteController.java` | `GET /api/v1/climate-routes` |
| `resources/data.sql` | 초기 샘플 데이터 5개 노선 |
| `resources/application.properties` | DB + JPA + 서울 버스 API 설정 |

### Check (검증)
- **분석 문서**: `docs/03-analysis/climate-bus-map-phase1.analysis.md`
- **Match Rate**: **93%**
- **통과 기준**: 90% ✅

---

## 3. Gap 분석 요약

### 발견된 갭 (2건)

| 갭 | 내용 | 심각도 | 조치 |
|----|------|--------|------|
| `SeoulBusApiConfig.java` 미구현 | 패키지 구조 명세에 있으나 실제로 필요 없음 — `@Value` 직접 주입으로 대체 | 낮음 | 불필요. Phase 2에서 재검토 |
| `ddl-auto=update` (설계는 `validate`) | 개발 편의를 위한 의도적 편차 | 낮음 | 운영 배포 전 `validate` 또는 프로파일 분리 필요 |

### 설계 초과 구현 (긍정적)

| 항목 | 내용 |
|------|------|
| `dto/ClimateRouteResponse.java` 분리 | 응답 DTO를 명시적으로 분리하여 타입 안전성 향상 |
| `defer-datasource-initialization=true` | `data.sql` 실행 순서 보장 — 실제 필요한 설정 추가 |
| `hibernate.format_sql=true` | 개발 시 SQL 가독성 향상 |

---

## 4. 학습 및 인사이트

### 기술적 인사이트

1. **`ddl-auto=update` vs `validate`**: 로컬 개발 초기에는 `update`가 편리하지만, 운영 환경에서는 예상치 못한 스키마 변경을 야기할 수 있어 `validate` + 명시적 DDL 관리가 안전함. Spring Boot `@Profile`로 환경별 분리 권장.

2. **DTO 분리의 중요성**: 설계 문서에서 응답 JSON 구조만 정의했으나, 실제 구현에서 `ClimateRouteResponse.java`를 별도 DTO로 분리한 것이 타입 안전성과 유지보수성을 높임.

3. **`defer-datasource-initialization=true`**: Spring Boot 3.x에서 JPA + `data.sql`을 함께 사용할 때 반드시 필요한 설정 — 설계 문서에 추가해야 할 실용적 지식.

### 프로세스 인사이트

- Phase 기반 개발 분리가 효과적. Phase 1 범위를 API 연동 검증으로 한정하여 집중도 유지.
- 설계 문서의 패키지 구조에 실제로 필요 없는 클래스(`SeoulBusApiConfig`)를 포함시킨 것은 향후 설계 시 "실제 필요 여부 검증" 후 문서화하는 습관이 필요함을 시사.

---

## 5. 완료 기준 최종 확인

| 완료 기준 | 코드 준비 | 실행 확인 |
|----------|----------|----------|
| 애플리케이션 정상 기동 | ✅ 모든 Bean 구성 완료 | 🔲 로컬 DB 연결 후 기동 필요 |
| 서울 버스 API 호출 성공 | ✅ `testConnection()` 구현 | 🔲 API 키 발급 후 실제 호출 필요 |
| `climate_eligible_routes` 테이블 + 초기 데이터 | ✅ 엔티티 + `data.sql` 완성 | 🔲 DB 생성 후 확인 필요 |
| `GET /api/v1/climate-routes` 정상 응답 | ✅ Controller~Repository 연결 완성 | 🔲 기동 후 Postman 확인 필요 |

> 코드 구현은 완료. 실행 확인은 PostgreSQL 로컬 환경 + API 키 발급 후 진행.

---

## 6. 다음 단계

### Phase 2 설계 시작 준비 완료

```bash
/pdca design climate-bus-map-phase2
```

Phase 2에서 다룰 내용:

| API | 설명 |
|-----|------|
| `GET /api/v1/stations/nearby` | 위치(lat, lng) 기반 반경 내 정류장 조회 |
| `GET /api/v1/stations/{id}/arrivals` | 도착 버스 목록 + 기후동행 가능 여부 병합 |

추가 설계 필요 항목:
- 서울 버스 API GRS80 → WGS84 좌표 변환 방식
- API 응답 캐싱 전략 (중복 호출 방지)
- `SeoulBusApiConfig` 필요 여부 재검토

### 환경 설정 Action Items

- [ ] PostgreSQL 로컬 DB 생성 (`climate_bus_map`)
- [ ] 서울 열린데이터광장 API 키 발급 신청 → `SEOUL_BUS_API_KEY` 환경 변수 설정
- [ ] 앱 기동 후 `GET /api/v1/climate-routes` Postman 확인
- [ ] `application-prod.properties` 생성 — `ddl-auto=validate` 설정

---

## 7. 참조 문서

| 문서 | 경로 |
|------|------|
| Plan | `docs/01-plan/features/climate-bus-map.plan.md` |
| Design | `docs/02-design/features/climate-bus-map-phase1.design.md` |
| Gap Analysis | `docs/03-analysis/climate-bus-map-phase1.analysis.md` |
| 이 보고서 | `docs/04-report/features/climate-bus-map-phase1.report.md` |
