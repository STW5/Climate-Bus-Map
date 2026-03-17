# Plan: 경로 폴리라인 실제 도로/철도 형상 적용

> ODsay loadLane API로 실제 도로/지하철 선형을 가져와 직선 대신 실제 경로대로 폴리라인 표시

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 문제 정의

현재 폴리라인은 정류소 좌표만 이어서 **직선**으로 표시됨.
실제 버스는 도로를 따라, 지하철은 선로를 따라 이동하므로 직선은 부정확한 시각 정보.

---

## 2. 해결 방법: ODsay loadLane API

ODsay가 제공하는 `loadLane` API로 각 구간의 실제 좌표 배열(graphPos)을 가져옴.

```
GET https://api.odsay.com/v1/api/loadLane
  ?mapObject=0:0@{routeId}:{startStationId}:{endStationId}:{type}
  &apiKey={key}

type: 1=버스, 2=지하철

응답:
result.lane[].section[].graphPos[]
  └── {x: 경도, y: 위도}  ← 실제 도로/선로 좌표 수백~수천 개
```

---

## 3. 구현 계획

1. `odsayApi.js`: `loadLaneForPath(subPaths)` 함수 추가
2. `App.jsx`: 경로 선택 시 loadLane 호출 후 MapView에 상세 좌표 전달
3. `MapView.jsx`: graphPos 좌표로 폴리라인 렌더링
4. **폴백**: loadLane 실패 시 기존 정류소 좌표 사용

---

## 4. 범위

- FE 전용, BE 변경 없음
- 도보 구간은 직선 유지 (loadLane 미지원)
