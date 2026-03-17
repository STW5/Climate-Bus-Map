# Plan: UI/UX 개선 통합 (세션 2026-03-17)

> 카카오맵/네이버 지도 벤치마킹 기반 UX 개선, 시각 디자인 품질 향상,
> 경로 탐색 기능 고도화를 통합한 개선 사이클

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 구현 완료 (Check 대기)

---

## 포함된 하위 Plan

| Feature | 파일 |
|---------|------|
| UX 개선 (도착시각·환승·스왑·스켈레톤) | ux-improvements.plan.md |
| 시각 디자인 (아이콘·배지·검색창) | visual-design-polish.plan.md |
| 도보 경로 폴리라인 표시 | walking-path-display.plan.md |
| 출발·도착 마커 및 보행로 | route-markers-walking-path.plan.md |
| 출발지 선택 | route-departure-selection.plan.md |
| 하늘색 테마 | ui-theme-skyblue.plan.md |
| 마커 렌더링 성능 최적화 | performance-optimization.plan.md |
| 탑승 대기 시간 표시 | route-boarding-time.plan.md |
| 경로 선택 상세 뷰 전환 | route-detail-view.plan.md |

---

## 구현 범위 요약

### FE (React/Vite)
- `App.jsx`: 경로 탐색 흐름 통합 (출발지·loadLane·보행로·상세뷰·탑승시간)
- `MapView.jsx`: 마커 diff 최적화, 출발·도착 핀, 폴리라인 색상
- `RouteSearchPanel.jsx`: 출발지 선택, 스왑 버튼, 검색 제안 UI 개선
- `RouteResultPanel.jsx`: 도착시각·환승횟수·탑승대기시간·스켈레톤·SVG 아이콘
- `ArrivalPanel.jsx`: 노선 배지 색상, 도착시간 타이포 개선, 정류장ID 제거
- `ClimateRoutesPanel.jsx`: 이모지 제거, 배지 스타일
- `SelectedRoutePanel.jsx`: 신규 — 경로 선택 시 상세 뷰 전환
- `App.css`: 디자인 토큰·스타일 전면 개선
- `api/odsayApi.js`: loadLane 추가
- `api/tmapApi.js`: getWalkingRoute, searchPlace 추가
- `api/busApi.js`: fetchBoardingTime 추가

### BE (Spring Boot)
- `SeoulBusApiAdapter.java`: 빈 결과 예외 처리 수정

---

## 검증 기준

- [ ] 경로 탐색 결과 카드에 도착 예정 시각 표시
- [ ] 출발·도착 스왑 버튼 동작
- [ ] 경로 선택 시 상세 뷰로 전환, 뒤로가기 동작
- [ ] 탑승 대기 시간 chip 표시 (버스 구간)
- [ ] 지도에 출발·도착 핀 마커 표시
- [ ] 도보 구간 회색 점선 표시
- [ ] 노선 배지 유형별 색상 구분
