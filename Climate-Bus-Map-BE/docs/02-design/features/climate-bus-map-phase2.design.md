# Design: Climate Bus Map — Phase 2 MVP Backend

> 위치 기반 정류장 조회 + 도착 버스 + 기후동행 가능 여부 통합 API

- **작성일**: 2026-03-06
- **참조**: `docs/01-plan/features/climate-bus-map.plan.md` (Phase 2)
- **아키텍처 참조**: `docs/02-design/architecture.design.md`
- **기술 스택**: Spring Boot 4.0.3 / Java 17 / Caffeine Cache

---

## 완료 기준 (Definition of Done)

- [ ] `GET /api/v1/stations/nearby?lat=&lng=&radius=` — ⚠️ 버스정류소정보조회 서비스 별도 등록 필요 (현재 미등록)
- [x] `GET /api/v1/stations/{stationId}/arrivals` 정상 응답 (저상버스 도착 + `climateEligible` 포함)
- [x] 기후동행 가능 노선은 `climateEligible: true`, 불가 노선은 `false`
- [x] 동일 요청 반복 시 캐시에서 응답 (서울 버스 API 중복 호출 없음)

## 등록된 API (data.go.kr 기준)

| # | 엔드포인트 | 설명 | 구현 여부 |
|---|-----------|------|-----------|
| 1 | `getArrInfoByRouteAllList` | 경유노선 전체 정류소 도착예정정보 | 미구현 |
| 2 | `getArrInfoByRouteList` | 한 정류소의 특정노선 도착예정정보 | 미구현 |
| 3 | `getLowArrInfoByStIdList` | 정류소ID로 저상버스 도착예정정보 | ✅ 구현 |
| 4 | `getLowArrInfoByRouteList` | 한 정류소의 특정노선 저상버스 도착예정정보 | 미구현 |

> ⚠️ **미등록 서비스**: `stationInfo/getStationByPos` (버스정류소정보조회)는 별도 서비스로 현재 미등록 상태.
> `/api/v1/stations/nearby`는 data.go.kr에서 '서울특별시 버스정류소정보조회 서비스' 신청 후 활성화 가능.

---

## 1. 패키지 구조 (Phase 2 추가분)

```
com.stw.climatebusmapbe
│
├── station/                              # [신규] 버스 정류장 도메인
│   ├── controller/
│   │   └── StationController.java
│   ├── service/
│   │   └── StationService.java
│   └── dto/
│       ├── NearbyStationsResponse.java   # 정류장 목록 응답
│       └── StationDto.java              # 정류장 단건 DTO
│
├── arrival/                              # [신규] 버스 도착 정보 도메인
│   ├── controller/
│   │   └── ArrivalController.java
│   ├── service/
│   │   └── ArrivalService.java
│   └── dto/
│       ├── ArrivalResponse.java          # 도착 목록 응답
│       └── ArrivalDto.java              # 도착 단건 DTO
│
├── external/busapi/
│   ├── BusApiPort.java                   # [수정] getNearbyStations, getArrivals 구현
│   ├── SeoulBusApiAdapter.java           # [수정] 두 메서드 실제 구현
│   └── dto/
│       ├── NearbyStationDto.java         # [수정] 필드 보강
│       └── BusArrivalDto.java            # [수정] 필드 보강
│
└── common/
    └── CoordinateConverter.java          # [신규] WGS84 ↔ TM 좌표 변환 유틸
```

---

## 2. API 스펙

### 2-1. GET /api/v1/stations/nearby

**Request**
```
GET /api/v1/stations/nearby?lat=37.5670&lng=126.9782&radius=500
```

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| `lat` | double | 필수 | WGS84 위도 |
| `lng` | double | 필수 | WGS84 경도 |
| `radius` | int | 500 | 반경 (미터, 최대 1000) |

**Response**
```json
{
  "success": true,
  "data": {
    "stations": [
      {
        "stationId": "111000018",
        "stationName": "광화문·세종문화회관앞",
        "arsId": "02-138",
        "lat": 37.5713,
        "lng": 126.9768
      }
    ]
  },
  "error": null
}
```

---

### 2-2. GET /api/v1/stations/{stationId}/arrivals

**Request**
```
GET /api/v1/stations/111000018/arrivals
```

**Response**
```json
{
  "success": true,
  "data": {
    "stationId": "111000018",
    "arrivals": [
      {
        "routeId": "100100118",
        "routeNo": "402",
        "arrivalSec1": 150,
        "arrivalSec2": 660,
        "climateEligible": true
      },
      {
        "routeId": "100200045",
        "routeNo": "103",
        "arrivalSec1": 90,
        "arrivalSec2": 420,
        "climateEligible": false
      }
    ]
  },
  "error": null
}
```

---

## 3. 좌표 변환 (WGS84 ↔ TM)

서울 버스 API `getStationByPos`는 **TM 좌표계** (GRS80 기반 EPSG:5181) 파라미터를 요구함.
프론트에서는 GPS 좌표(WGS84 lat/lng)를 전달하므로 변환 필요.

```
[프론트] lat/lng (WGS84)
    ↓  CoordinateConverter.toTM()
[서울버스 API 호출] tmX, tmY
    ↓  API 응답 (gpsX, gpsY 는 이미 WGS84)
[응답] lat/lng 그대로 사용
```

### CoordinateConverter.java

```java
@Component
public class CoordinateConverter {

    // WGS84 → TM (EPSG:5181 Korean Central Belt)
    public double[] toTM(double lat, double lng) {
        // proj4j 라이브러리 사용
        // CRSFactory: EPSG:4326 → EPSG:5181 변환
        // 반환: [tmX, tmY]
    }
}
```

**build.gradle 추가**
```groovy
implementation 'org.locationtech.proj4j:proj4j:1.3.0'
implementation 'org.locationtech.proj4j:proj4j-epsg:1.3.0'
```

---

## 4. 서울 버스 API 연동 상세

### 4-1. 정류장 조회 (`getStationByPos`) — ⚠️ 미등록 서비스

> **현재 사용 불가**: `stationInfo/getStationByPos`는 '서울특별시 버스정류소정보조회 서비스' 소속으로,
> 현재 등록된 '버스도착정보조회 서비스'와 별개입니다.
> `StationService.getNearbyStations()`는 `BusApiException`을 throw하도록 구현됨.

data.go.kr에서 별도 신청 후 구현 예정.

---

### 4-2. 도착 정보 조회 (`getLowArrInfoByStIdList`) — ✅ 등록됨

| 항목 | 내용 |
|------|------|
| URL | `{baseUrl}/arrive/getLowArrInfoByStIdList` |
| 파라미터 | `serviceKey`, `stId` |
| 응답 형식 | XML (JSON 미지원) |
| 응답 경로 | `ServiceResult > msgBody > itemList` |
| 대상 | 저상버스 (低床버스) 한정

**응답 필드 매핑**
| 서울버스 API 필드 | BusArrivalDto 필드 | 설명 |
|-----------------|-------------------|------|
| `busRouteId` | `routeId` | 노선 고유 ID |
| `rtNm` | `routeNo` | 노선 번호 (예: "402") |
| `exps1` | `arrivalSec1` | 1번째 버스 도착 예정 초 |
| `exps2` | `arrivalSec2` | 2번째 버스 도착 예정 초 |

---

## 5. 기후동행 병합 로직

`ArrivalService`에서 도착 버스 목록과 `climate_eligible_routes` 테이블을 비교:

```java
// 기후동행 가능 routeId Set을 미리 로드
Set<String> eligibleRouteIds = routeRepository.findAll()
    .stream()
    .map(ClimateEligibleRoute::getRouteId)
    .collect(Collectors.toSet());

// 각 도착 버스에 climateEligible 여부 세팅
List<ArrivalDto> arrivals = busApiPort.getArrivals(stationId)
    .stream()
    .map(dto -> new ArrivalDto(
        dto.getRouteId(),
        dto.getRouteNo(),
        dto.getArrivalSec1(),
        dto.getArrivalSec2(),
        eligibleRouteIds.contains(dto.getRouteId())   // ← 병합
    ))
    .toList();
```

---

## 6. 캐싱 전략 (Caffeine)

서울 버스 API 호출 제한 및 응답 속도 개선을 위해 인메모리 캐시 적용.

| 캐시 이름 | 적용 메서드 | TTL | 이유 |
|-----------|------------|-----|------|
| ~~`nearbyStations`~~ | ~~`SeoulBusApiAdapter.getNearbyStations()`~~ | ~~5분~~ | 미등록 서비스로 미사용 |
| `arrivals` | `SeoulBusApiAdapter.getArrivals()` | 30초 | 실시간 데이터, 너무 오래 캐시하면 부정확 |

### build.gradle 추가
```groovy
implementation 'org.springframework.boot:spring-boot-starter-cache'
implementation 'com.github.ben-manes.caffeine:caffeine'
```

### application.properties 추가
```properties
spring.cache.type=caffeine
spring.cache.caffeine.spec=maximumSize=500
```

### CacheConfig.java (신규)
```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCacheNames(List.of("nearbyStations", "arrivals"));
        return manager;
    }

    @Bean
    public Caffeine<Object, Object> caffeineConfig() {
        return Caffeine.newBuilder().recordStats();
    }
}
```

### Adapter에서 캐시 적용
```java
@Cacheable(value = "nearbyStations", key = "#tmX + '_' + #tmY + '_' + #radius")
public List<NearbyStationDto> getNearbyStations(double tmX, double tmY, int radius) { ... }

@Cacheable(value = "arrivals", key = "#stationId")
public List<BusArrivalDto> getArrivals(String stationId) { ... }
```

---

## 7. 예외 처리

`GlobalExceptionHandler`에 서울 버스 API 오류 케이스 추가:

| 상황 | 처리 |
|------|------|
| 서울 버스 API 응답 코드 `0` 아님 | `BusApiException` (런타임) → 500 |
| 서울 버스 API 타임아웃 | `RestClientException` → 503 |
| 정류장 ID 없음 (빈 itemList) | 빈 배열 반환 (에러 아님) |

```java
// GlobalExceptionHandler에 추가
@ExceptionHandler(BusApiException.class)
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public ApiResponse<Void> handleBusApiException(BusApiException e) {
    return ApiResponse.fail("서울 버스 API 오류: " + e.getMessage());
}
```

---

## 8. build.gradle 변경 요약

```groovy
// 추가
implementation 'org.springframework.boot:spring-boot-starter-cache'
implementation 'com.github.ben-manes.caffeine:caffeine'
implementation 'org.locationtech.proj4j:proj4j:1.3.0'
implementation 'org.locationtech.proj4j:proj4j-epsg:1.3.0'
```

---

## 9. 구현 순서 체크리스트

```
[ ] 1. build.gradle 의존성 추가 (cache, caffeine, proj4j)
[ ] 2. CoordinateConverter 유틸 구현 + 단위 테스트
[ ] 3. NearbyStationDto, BusArrivalDto 필드 보강
[ ] 4. SeoulBusApiAdapter.getNearbyStations() 구현
[ ] 5. SeoulBusApiAdapter.getArrivals() 구현
[ ] 6. CacheConfig 작성 + @EnableCaching 적용
[ ] 7. station 도메인 (StationService → StationController) 구현
[ ] 8. arrival 도메인 (ArrivalService → ArrivalController) 구현
[ ] 9. GlobalExceptionHandler BusApiException 추가
[ ] 10. 단위 테스트 (StationService, ArrivalService — BusApiPort Mock)
[ ] 11. 앱 기동 후 Postman으로 두 API 실제 응답 확인
```

---

## 10. Phase 2 완료 후 다음 단계

```bash
/pdca design climate-bus-map-phase3
```

Phase 3에서 다룰 내용:
- React + T-Map SDK 프로젝트 초기화
- 현재 위치 감지 → `/api/v1/stations/nearby` 호출 → 지도에 마커 표시
- 마커 클릭 → `/api/v1/stations/{id}/arrivals` 호출 → 도착 패널
- 기후동행 가능 여부 배지 (`🟢 / 🔴`)
