# Plan: 경로 카드 버스 탑승 대기 시간 표시

> 경로 탐색 결과에서 첫 번째 탑승 버스의 실시간 도착 잔여 시간 표시

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 문제 정의

경로 결과 카드에서 "38분 소요"는 알 수 있지만
"내가 지금 타야 하는 버스가 몇 분 후에 오는지"는 알 수 없다.
카카오맵처럼 "8분 후 탑승" 표시가 있으면 경로 선택에 실질적 도움이 됨.

---

## 2. 데이터 흐름 분석

ODsay `searchPubTransPathT` 응답:
- `subPath[].trafficType`: 1=지하철, 2=버스, 3=도보
- `subPath[].lane[0].busNo`: 버스 노선번호 (탑승할 버스)
- `subPath[].passStopList.stations[0]`: 첫 탑승 정류소 `{ x(lng), y(lat), stationName }`

BE API:
- `GET /api/v1/stations/nearby?lat=&lng=&radius=150` → 서울 버스 정류소 목록
- `GET /api/v1/stations/{stationId}/arrivals` → 실시간 도착 정보

---

## 3. 구현 방법

```
searchTransitRoute() 완료
  → 각 path의 첫 버스 subPath 추출
  → passStopList.stations[0] 좌표로 fetchNearbyStations(lat,lng,150)
  → fetchArrivals(stationId)
  → lane[0].busNo 매칭 → arrivalSec 획득
  → RouteCard에 "N분 후 탑승" 표시
```

### 제약사항
- **버스만 지원**: 지하철 실시간 정보 없음 (BE 미지원)
- **첫 번째 대중교통 구간만**: 환승 구간은 탑승 시각 계산 어려움
- **실패 시 표시 안 함**: API 오류나 매칭 실패 시 조용히 숨김

---

## 4. 구현 파일

| 파일 | 변경 |
|------|------|
| `src/api/busApi.js` | `fetchBoardingTime(subPaths)` 함수 추가 |
| `src/App.jsx` | 경로 탐색 후 탑승 시간 병렬 조회, `boardingTimes` state |
| `src/components/RouteResultPanel.jsx` | RouteCard에 탑승 시간 표시 |

---

## 5. 범위

- FE 전용, BE 변경 없음
- 기존 `/api/v1/stations/nearby` 재활용
