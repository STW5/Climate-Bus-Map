# Design: Backend Architecture

> Feature-based 3-layer + External API Adapter 패턴

- **작성일**: 2026-03-04
- **적용 범위**: 전체 Phase (Phase 1 리팩토링 포함)

---

## 1. 설계 원칙

| 원칙 | 내용 |
|------|------|
| Feature-based 패키지 | 레이어(controller/service/…)가 아닌 도메인(route/station/arrival)으로 묶기 |
| 3-layer per feature | 각 도메인 안에 Controller → Service → Repository 완결 |
| Port/Adapter (외부 API 한정) | 서울 버스 API 호출은 Port 인터페이스 뒤에 격리 |
| 오버엔지니어링 금지 | UseCase 레이어, Domain 객체 분리 등 풀 헥사고날은 적용하지 않음 |

---

## 2. 패키지 구조

```
com.stw.climatebusmapbe
│
├── common/                          # 프로젝트 전역 공통
│   ├── ApiResponse.java             # 통일 응답 래퍼 { success, data, error }
│   └── GlobalExceptionHandler.java  # 전역 예외 처리
│
├── config/                          # Spring 설정
│   └── WebConfig.java               # CORS
│
├── route/                           # [도메인] 기후동행 노선
│   ├── ClimateRouteController.java
│   ├── ClimateRouteService.java
│   ├── ClimateEligibleRouteRepository.java
│   ├── ClimateEligibleRoute.java    # JPA Entity
│   └── dto/
│       └── ClimateRouteResponse.java
│
├── station/                         # [도메인] 버스 정류장 (Phase 2)
│   ├── StationController.java       # GET /api/v1/stations/nearby
│   ├── StationService.java
│   └── dto/
│       ├── NearbyStationsRequest.java
│       └── NearbyStationsResponse.java
│
├── arrival/                         # [도메인] 버스 도착 정보 (Phase 2)
│   ├── ArrivalController.java       # GET /api/v1/stations/{id}/arrivals
│   ├── ArrivalService.java
│   └── dto/
│       └── ArrivalResponse.java
│
└── external/                        # 외부 API 어댑터
    └── busapi/
        ├── BusApiPort.java          # Port 인터페이스
        ├── SeoulBusApiAdapter.java  # Adapter 구현체
        └── dto/                     # 서울 버스 API 응답 DTO
            ├── BusRouteInfoDto.java
            ├── NearbyStationDto.java
            └── BusArrivalDto.java
```

---

## 3. 레이어 의존 방향

```
[Controller] → [Service] → [Repository / BusApiPort]
                                       ↑
                             [SeoulBusApiAdapter]
                             (BusApiPort 구현체)
```

- Controller는 Service에만 의존
- Service는 Repository와 BusApiPort(인터페이스)에 의존
- SeoulBusApiAdapter는 BusApiPort를 구현 — Service는 구현체를 모름
- 테스트 시 BusApiPort를 Mock으로 주입 가능

---

## 4. 도메인별 DB/API 구분

| 도메인 | DB 엔티티 | 데이터 출처 |
|--------|-----------|------------|
| `route` | `ClimateEligibleRoute` | 자체 DB (기후동행 가능 노선 목록) |
| `station` | 없음 | 서울 버스 API 실시간 호출 |
| `arrival` | 없음 | 서울 버스 API 실시간 호출 |

> station과 arrival은 DB 저장 없이 외부 API 응답을 가공해서 바로 반환.
> 단, Phase 2에서 캐싱 전략 추가 시 Redis 도입 가능 (별도 설계).

---

## 5. Port/Adapter 상세

### BusApiPort.java (인터페이스)

```java
public interface BusApiPort {
    // Phase 1: 연결 테스트
    String testConnection(String busRouteId);

    // Phase 2: 위치 기반 정류장 조회 (TM 좌표계)
    List<NearbyStationDto> getNearbyStations(double tmX, double tmY, int radius);

    // Phase 2: 정류장 도착 정보 조회
    List<BusArrivalDto> getArrivals(String stationId);
}
```

### SeoulBusApiAdapter.java (구현체)

```java
@Component
public class SeoulBusApiAdapter implements BusApiPort {
    // RestClient로 서울 버스 API 호출
    // XML/JSON 파싱 후 DTO 반환
    // HTTP 오류 → 도메인 예외로 변환
}
```

### StationService 예시 (Port 사용)

```java
@Service
@RequiredArgsConstructor
public class StationService {

    private final BusApiPort busApiPort;          // 인터페이스 주입
    private final ClimateEligibleRouteRepository routeRepository;

    public NearbyStationsResponse getNearbyStations(double lat, double lng) {
        // 1. WGS84 → TM 좌표 변환
        // 2. busApiPort.getNearbyStations() 호출
        // 3. 기후동행 가능 여부 병합 (routeRepository 사용)
        // 4. 응답 DTO 반환
    }
}
```

---

## 6. API 엔드포인트 목록

| Phase | Method | URL | 설명 |
|-------|--------|-----|------|
| 1 | GET | `/api/v1/climate-routes` | 기후동행 노선 목록 |
| 2 | GET | `/api/v1/stations/nearby?lat=&lng=&radius=` | 위치 기반 정류장 조회 |
| 2 | GET | `/api/v1/stations/{stationId}/arrivals` | 정류장 도착 버스 + 기후동행 여부 |

---

## 7. Phase 1 리팩토링 체크리스트

현재 코드를 이 아키텍처에 맞게 이동:

```
[ ] entity/ClimateEligibleRoute.java       → route/ClimateEligibleRoute.java
[ ] repository/ClimateEligibleRouteRepository.java → route/ClimateEligibleRouteRepository.java
[ ] service/ClimateRouteService.java       → route/ClimateRouteService.java
[ ] controller/ClimateRouteController.java → route/ClimateRouteController.java
[ ] dto/ClimateRouteResponse.java          → route/dto/ClimateRouteResponse.java
[ ] client/SeoulBusApiClient.java          → external/busapi/SeoulBusApiAdapter.java
                                              + BusApiPort.java (인터페이스 추출)
```

> 이동 후 package 선언 및 import 경로 수정 필요.
> ClimateRouteService는 아직 BusApiPort를 사용하지 않으므로 의존성 변경 없음.
