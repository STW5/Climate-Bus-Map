# Plan: realtime-location

**작성일:** 2026-03-18
**Feature:** realtime-location

---

## 1. 배경 및 목적

현재 앱은 `navigator.geolocation.getCurrentPosition()`으로 **최초 1회만** 위치를 가져온다.
카카오맵/네이버지도처럼 GPS 위치가 실시간으로 지도에 표시되도록 개선한다.

---

## 2. 목표

- 지도 위에 **내 위치 파란 점** 마커 표시
- 이동 시 파란 점이 **실시간으로 따라 이동**
- 기존 GPS 재중앙 버튼과 연동

---

## 3. 구현 범위

### IN SCOPE
- `useGeolocation`: `getCurrentPosition` → `watchPosition` 교체
- `MapView`: 내 위치 파란 점 마커 추가 및 실시간 업데이트
- 정확도 원(accuracy circle) 선택적 표시

### OUT OF SCOPE
- 경로 안내 중 지도 자동 재중앙 (카카오 내비 방식) — 별도 기능
- 이동 경로 기록/궤적 표시

---

## 4. 기술 접근

| 항목 | 내용 |
|---|---|
| 위치 갱신 | `navigator.geolocation.watchPosition()` |
| 정확도 옵션 | `enableHighAccuracy: true` |
| 마커 | T-Map SDK Marker, SVG 파란 점 아이콘 |
| 업데이트 | position 변경 시 마커 `setPosition()` 호출 |
| cleanup | `clearWatch(watchId)` on unmount |

---

## 5. 수정 파일

- `src/hooks/useGeolocation.js` — watchPosition으로 교체
- `src/components/MapView.jsx` — 내 위치 마커 추가

---

## 6. 완료 기준

- [ ] 지도에 파란 점 마커가 표시됨
- [ ] 위치가 바뀌면 마커가 이동함
- [ ] 앱 종료/언마운트 시 watchPosition 정리됨
- [ ] 기존 GPS 버튼(재중앙) 동작 유지
