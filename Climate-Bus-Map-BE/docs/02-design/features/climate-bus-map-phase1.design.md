# Design: Climate Bus Map — Phase 1 기반 구축

> 서울 버스 공공 API 연동 검증 + DB 스키마 구성 + 프로젝트 뼈대 완성

- **작성일**: 2026-03-04
- **참조**: `docs/01-plan/features/climate-bus-map.plan.md` (Phase 1)
- **전체 설계 참조**: `docs/02-design/features/climate-bus-map.design.md`
- **기술 스택**: Spring Boot 4.0.3 / Java 17 / PostgreSQL / Gradle

---

## 완료 기준 (Definition of Done)

- [ ] 애플리케이션이 정상 기동됨
- [ ] 서울 버스 API 호출 성공 (Postman 또는 테스트 API 응답 확인)
- [ ] `climate_eligible_routes` 테이블 생성 + 초기 데이터 존재
- [ ] `GET /api/v1/climate-routes` 응답 정상 반환

---

## 1. 패키지 구조

현재 베이스 패키지: `com.stw.climatebusmapbe`

```
com.stw.climatebusmapbe
├── ClimateBusMapBeApplication.java    # (기존)
├── common
│   ├── ApiResponse.java               # 공통 응답 래퍼
│   └── GlobalExceptionHandler.java    # 예외 처리
├── config
│   ├── WebConfig.java                 # CORS 설정
│   └── SeoulBusApiConfig.java         # 서울 버스 API 설정 빈
├── client
│   └── SeoulBusApiClient.java         # 서울 버스 공공 API HTTP 클라이언트
├── entity
│   └── ClimateEligibleRoute.java      # 기후동행 가능 노선 엔티티
├── repository
│   └── ClimateEligibleRouteRepository.java
├── service
│   └── ClimateRouteService.java       # 기후동행 노선 목록 조회
└── controller
    └── ClimateRouteController.java    # GET /api/v1/climate-routes
```

> Phase 2에서 `StationController`, `ArrivalController` 추가 예정

---

## 2. 공통 응답 포맷

### ApiResponse.java

```java
// 모든 API 응답을 이 형태로 통일
{
  "success": true,
  "data": { ... },
  "error": null
}

// 에러 시
{
  "success": false,
  "data": null,
  "error": "에러 메시지"
}
```

```java
@Getter
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String error;

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> fail(String error) {
        return new ApiResponse<>(false, null, error);
    }
}
```

---

## 3. DB 스키마

### 3-1. climate_eligible_routes 테이블

```sql
CREATE TABLE climate_eligible_routes (
    id          BIGSERIAL    PRIMARY KEY,
    route_id    VARCHAR(20)  NOT NULL UNIQUE,   -- 서울 버스 API 고유 노선 ID
    route_no    VARCHAR(20)  NOT NULL,           -- 표시 노선 번호 (예: "402")
    route_type  VARCHAR(10),                     -- 간선 / 지선 / 광역 / 순환
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
```

### 3-2. JPA Entity

```java
@Entity
@Table(name = "climate_eligible_routes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClimateEligibleRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "route_id", nullable = false, unique = true, length = 20)
    private String routeId;

    @Column(name = "route_no", nullable = false, length = 20)
    private String routeNo;

    @Column(name = "route_type", length = 10)
    private String routeType;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

### 3-3. 초기 데이터 (data.sql)

Phase 1에서는 서울시 기후동행카드 홈페이지 기준 샘플 데이터만 입력.

```sql
-- src/main/resources/data.sql
INSERT INTO climate_eligible_routes (route_id, route_no, route_type, updated_at) VALUES
('100100118', '402',  '간선', NOW()),
('100100234', '721',  '지선', NOW()),
('100100056', '201',  '간선', NOW()),
('100100112', '271',  '간선', NOW()),
('100100089', '370',  '지선', NOW())
ON CONFLICT (route_id) DO NOTHING;
```

> **실제 전체 노선 목록**: 서울시 기후동행카드 공식 홈페이지 또는 공시 PDF에서 확인 후 추가

---

## 4. 서울 버스 API 클라이언트 (기반)

### 4-1. API 기본 정보

| 항목 | 내용 |
|------|------|
| Base URL | `http://ws.bus.go.kr/api/rest` |
| 인증 방식 | Query Parameter (`serviceKey`) |
| 응답 형식 | XML (기본) 또는 JSON (`resultType=json` 파라미터) |
| 등록 위치 | https://data.seoul.go.kr |

### 4-2. Phase 1 연동 테스트 대상 API

| 테스트 목적 | API | 비고 |
|-------------|-----|------|
| API 키 유효성 확인 | `BusRouteInfoService/getBusRouteList` | 노선 목록 조회 |
| 연결 성공 확인 | 응답 코드 `0000` 여부 | 에러 코드 참고 |

### 4-3. SeoulBusApiClient (Phase 1 최소 구현)

```java
@Component
public class SeoulBusApiClient {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String baseUrl;

    public SeoulBusApiClient(
        RestTemplateBuilder builder,
        @Value("${seoul.bus.api.key}") String apiKey,
        @Value("${seoul.bus.api.base-url}") String baseUrl
    ) {
        this.restTemplate = builder.build();
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    // Phase 1: 연결 테스트용 — 노선 1개 조회
    public String testConnection(String busRouteId) {
        String url = baseUrl + "/busRouteInfo/getBusRouteInfo"
            + "?serviceKey=" + apiKey
            + "&busRouteId=" + busRouteId
            + "&resultType=json";
        return restTemplate.getForObject(url, String.class);
    }
}
```

> Phase 2에서 `getNearbyStations()`, `getArrivals()` 메서드 추가

---

## 5. ClimateRouteController (Phase 1 구현 대상)

Phase 1에서 실제로 동작하는 유일한 API 엔드포인트.

```
GET /api/v1/climate-routes
```

**Response**
```json
{
  "success": true,
  "data": {
    "updatedAt": "2026-03-01T00:00:00",
    "routes": [
      { "routeId": "100100118", "routeNo": "402", "routeType": "간선" },
      { "routeId": "100100234", "routeNo": "721", "routeType": "지선" }
    ]
  },
  "error": null
}
```

---

## 6. 환경 설정

### 6-1. application.properties

```properties
spring.application.name=Climate-Bus-Map-BE

# DB 연결
spring.datasource.url=jdbc:postgresql://localhost:5432/climate_bus_map
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true

# 초기 데이터 (data.sql 자동 실행)
spring.sql.init.mode=always

# 서울 버스 API
seoul.bus.api.key=${SEOUL_BUS_API_KEY}
seoul.bus.api.base-url=http://ws.bus.go.kr/api/rest
```

> `ddl-auto=validate` — 테이블은 data.sql 또는 수동 DDL로 생성, JPA는 검증만

### 6-2. 로컬 개발용 환경 변수

```bash
# .env 또는 IDE 환경 변수 설정
SEOUL_BUS_API_KEY=발급받은_인증키
DB_USERNAME=postgres
DB_PASSWORD=비밀번호
```

### 6-3. CORS 설정 (WebConfig)

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000")   // React 개발 서버
            .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
```

---

## 7. 구현 순서 체크리스트

```
Phase 1 구현 순서:

[ ] 1. PostgreSQL 로컬 DB 생성 (climate_bus_map)
[ ] 2. application.properties 환경 변수 설정
[ ] 3. climate_eligible_routes 테이블 생성 (DDL 직접 실행)
[ ] 4. data.sql 작성 + 초기 데이터 확인
[ ] 5. ClimateEligibleRoute 엔티티 + Repository 구현
[ ] 6. ApiResponse 공통 응답 클래스 작성
[ ] 7. WebConfig (CORS) 작성
[ ] 8. ClimateRouteService + Controller 구현
[ ] 9. 앱 기동 확인 → GET /api/v1/climate-routes 응답 확인
[ ] 10. SeoulBusApiClient 기본 구현 + API 연결 테스트
```

---

## 8. 리스크 및 주의사항

| 리스크 | 내용 | 대응 |
|--------|------|------|
| 서울 버스 API 키 발급 지연 | 공공데이터포털 심사 시간 소요 가능 | 먼저 신청 후 나머지 작업 진행 |
| GRS80 좌표계 변환 | Phase 2 이슈 — Phase 1에서는 불필요 | Phase 2 설계 때 처리 |
| PostgreSQL 로컬 설치 | Docker 사용 권장 | `docker run -e POSTGRES_PASSWORD=... -p 5432:5432 postgres` |

---

## 9. Phase 1 완료 후 다음 단계

Phase 1이 완료되면:

```bash
/pdca design climate-bus-map-phase2
```

Phase 2 Design 문서에서 다룰 내용:
- `GET /api/v1/stations/nearby` — 위치 기반 정류장 조회 API
- `GET /api/v1/stations/{id}/arrivals` — 도착 정보 + 기후동행 병합
- 서울 버스 API GRS80 → WGS84 좌표 변환 로직
- API 캐싱 전략
