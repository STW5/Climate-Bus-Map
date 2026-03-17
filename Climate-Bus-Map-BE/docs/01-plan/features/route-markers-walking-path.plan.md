# Plan: 경로 출발/도착 마커 및 도보 경로 개선

> 출발/도착 표식 마커 추가, 도보 구간 실제 보행로 따라 점선 표시

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 문제 정의

1. 경로 선택 시 출발/도착 지점 표식이 없어 어디서 시작/끝나는지 불명확
2. 도보 구간이 직선으로 표시됨 (실제 보행로와 다름)
3. 도보 구간 좌표(startX/Y, endX/Y) 필드 인식 문제

---

## 2. 해결 방법

### 출발/도착 마커
- MapView에서 경로 첫 좌표 → "출발" 마커
- 경로 마지막 좌표 → "도착" 마커
- T-Map `Tmapv2.Marker` + `iconHTML` 옵션으로 색상 레이블

### 도보 보행로
- T-Map 보행자 경로 API (`POST /tmap/routes/pedestrian`)
- 각 도보 subPath의 startX/Y → endX/Y 로 보행 경로 조회
- 응답의 LineString 좌표를 graphPos 형식으로 변환 후 저장
- 기존 graphPos 렌더링 로직 재활용 (도보/대중교통 동일 처리)

---

## 3. 데이터 흐름

```
handleSelectPath()
  → loadLaneForPath()       (대중교통 도형)
  → getWalkingRoute()×N     (도보 구간별 보행로)
  → setSelectedPath()       (graphPos 포함된 subPaths)
  → MapView 렌더링          (출발/도착 마커 + 폴리라인)
```

---

## 4. 구현 파일

- `src/api/tmapApi.js` — `getWalkingRoute()` 추가
- `src/App.jsx` — `handleSelectPath`에서 도보 경로 병렬 조회
- `src/components/MapView.jsx` — 출발/도착 마커, routeMarkersRef 추가

---

## 5. 범위

- FE 전용, BE 변경 없음
- 도보 API 실패 시 직선 폴백 유지
