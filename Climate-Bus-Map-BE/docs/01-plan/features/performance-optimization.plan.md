# Plan: 프론트엔드 성능 최적화

> 지도 렌더링 및 API 호출 최적화로 렉 감소

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 문제 정의

앱 사용 중 렉(버벅임)이 발생함. 주요 원인 후보:
1. 정류소 마커 다수 동시 렌더링
2. 위치 변경 시마다 API 재호출
3. 경로 폴리라인 그리기 시 다수의 LatLng 객체 생성
4. MapView re-render 빈도 과다

---

## 2. 최적화 계획

### 2-1. 마커 최적화
- 현재: 정류소 변경 시 전체 마커 삭제 후 재생성
- 개선: 이전 마커와 비교해 변경된 것만 업데이트 (diffing)

### 2-2. API 호출 debounce
- 위치(position) 변경 시 `fetchNearbyStations` 즉시 호출 중
- 개선: 위치가 일정 거리(예: 50m) 이상 변경될 때만 재호출

### 2-3. MapView 리렌더 방지
- `stations` prop이 배열 참조로 매번 새로 생성될 수 있음
- `useMemo`로 `displayedStations` 안정화 (이미 적용됨)
- `onStationSelect` `useCallback` 의존성 검토

### 2-4. 폴리라인 최적화
- 경로 변경 시 전체 폴리라인 삭제 후 재생성 중
- 동일 경로 재선택 시 불필요한 재그리기 방지

---

## 3. 구현 계획

1. `useGeolocation.js` — 위치 변경 임계값(threshold) 적용
2. `MapView.jsx` — 마커 diff 업데이트, 폴리라인 중복 방지
3. `App.jsx` — stations API debounce

---

## 4. 범위

- FE 전용, BE 변경 없음
- 성능 개선이 목적이므로 기능 변경 없음
