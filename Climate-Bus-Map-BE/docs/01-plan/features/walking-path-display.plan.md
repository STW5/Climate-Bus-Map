# Plan: 도보 구간 폴리라인 및 시간 정확도 개선

> 도보 구간을 지도에 표시하고 도보 시간 계산 정확도 수정

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 문제 정의

1. 도보 구간(trafficType=3)이 지도에 폴리라인으로 표시되지 않거나 좌표가 없어 표시 실패
2. 도보 시간이 실제와 다르게 표시됨

---

## 2. 원인 분석

### 도보 폴리라인 미표시
ODsay 도보 구간은 `passStopList.stations`가 비어있고
대신 `startX`, `startY`, `endX`, `endY` 좌표를 직접 제공한다.
현재 MapView는 `passStopList.stations`만 읽으므로 도보 좌표를 못 찾음.

### 도보 시간
ODsay `sectionTime`은 분(minute) 단위.
RouteResultPanel에서 단위 변환 오류 가능성 있음.

---

## 3. 해결 방법

### MapView.jsx
도보 구간 좌표 폴백 순서:
1. `graphPos` (있으면 사용, 도보는 없음)
2. `passStopList.stations` (있으면 사용)
3. `startX/Y` → `endX/Y` (도보 fallback)

### RouteResultPanel.jsx
`sectionTime` 단위 확인 후 분/초 정확히 표시

---

## 4. 구현 파일

- `src/components/MapView.jsx` — 도보 좌표 fallback 추가
- `src/components/RouteResultPanel.jsx` — 도보 시간 단위 확인

---

## 5. 범위

- FE 전용, BE 변경 없음
- 도보는 직선(실제 보행로 불필요), 회색 점선 유지
