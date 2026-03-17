# Design: 경로 폴리라인 실제 도로/철도 형상 적용

- **작성일**: 2026-03-17

---

## 1. loadLane mapObject 형식

```
"0:0@{routeId}:{startStationId}:{endStationId}:{type}"

복수 구간:
"0:0@{r1}:{s1}:{e1}:{t1}@{r2}:{s2}:{e2}:{t2}"
```

- `routeId`: 버스=`lane[0].busRouteId`, 지하철=`lane[0].subwayCode`
- `startStationId`: `passStopList.stations[0].stationID`
- `endStationId`: `passStopList.stations[last].stationID`
- `type`: 버스=1, 지하철=2

---

## 2. 응답 구조 → 좌표 추출

```javascript
result.lane[i].section[j].graphPos[k]
  → { x: 경도, y: 위도 }
```

각 구간(lane)의 section을 순서대로 합쳐 좌표 배열 생성.

---

## 3. 데이터 흐름

```
searchTransitRoute()
  → 경로 선택 (RouteResultPanel 클릭)
  → loadLaneForPath(subPaths)   ← 신규
  → MapView에 상세좌표 포함된 subPaths 전달
  → 폴리라인 렌더링
```

---

## 4. 폴백 전략

loadLane 실패(API 오류 / stationID 없음) 시:
- `passStopList.stations[].x, y` 좌표로 폴백
- 사용자에게 별도 오류 표시 없음

---

## 5. 구현 파일

- `src/api/odsayApi.js` — `loadLaneForPath()` 추가
- `src/App.jsx` — 경로 선택 핸들러에서 loadLane 호출
- `src/components/MapView.jsx` — `shapeCoords` prop 추가 또는 기존 로직 활용
