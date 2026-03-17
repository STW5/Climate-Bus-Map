# UI/UX 개선 통합 Analysis Report

> **Analysis Type**: Gap Analysis (Plan vs Implementation)
>
> **Project**: Climate-Bus-Map
> **Analyst**: Claude (gap-detector)
> **Date**: 2026-03-17
> **Plan Doc**: [ui-ux-improvements.plan.md](../01-plan/features/ui-ux-improvements.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Plan 문서(ui-ux-improvements.plan.md)의 검증 기준 7개 항목에 대해
실제 구현 코드와 1:1 대조하여 Match Rate를 산출한다.

### 1.2 Analysis Scope

- **Plan 문서**: `docs/01-plan/features/ui-ux-improvements.plan.md`
- **구현 파일**: `App.jsx`, `MapView.jsx`, `RouteSearchPanel.jsx`, `RouteResultPanel.jsx`, `ArrivalPanel.jsx`, `ClimateRoutesPanel.jsx`, `SelectedRoutePanel.jsx`, `api/odsayApi.js`, `api/tmapApi.js`, `api/busApi.js`
- **분석일**: 2026-03-17

---

## 2. 검증 기준별 Gap Analysis

### 2.1 검증 항목 대조표

| # | 검증 기준 | 구현 상태 | 구현 위치 | 비고 |
|:-:|-----------|:---------:|-----------|------|
| 1 | 경로 탐색 결과 카드에 도착 예정 시각 표시 | ✅ 구현 | `RouteResultPanel.jsx:14-18, 155` | `arrivalTimeStr()` 함수로 "오전/오후 HH:MM 도착" 형식 표시 |
| 2 | 출발/도착 스왑 버튼 동작 | ✅ 구현 | `RouteSearchPanel.jsx:104-114, 170-177` | `handleSwap()`으로 출발/도착 state 양방향 교환, SVG 아이콘 버튼 |
| 3 | 경로 선택 시 상세 뷰 전환 + 뒤로가기 | ✅ 구현 | `App.jsx:109-142, 217-224` / `SelectedRoutePanel.jsx:104-160` | `selectedPath` state로 뷰 전환, 뒤로가기(`onBack`) + 닫기(`onClose`) 동작 |
| 4 | 탑승 대기 시간 chip 표시 (버스 구간) | ✅ 구현 | `RouteResultPanel.jsx:124-137` / `busApi.js:32-55` | `BoardingChip` 컴포넌트, `fetchBoardingTime()` API, 긴급(2분 이하) 스타일 분기 |
| 5 | 지도에 출발/도착 핀 마커 표시 | ✅ 구현 | `MapView.jsx:166-195` | SVG 핀 아이콘 동적 생성, 출발(하늘색 `#0ea5e9`) / 도착(분홍 `#e11d48`) |
| 6 | 도보 구간 회색 점선 표시 | ✅ 구현 | `MapView.jsx:87, 151, 108` | `trafficType === 3`일 때 `strokeStyle: 'dash'`, 색상 `#4b5563`(진회색) |
| 7 | 노선 배지 유형별 색상 구분 | ✅ 구현 | `ArrivalPanel.jsx:51-59` | 심야(남색)/광역(적색)/간선(청색)/지선(녹색)/순환(주황) 5종 분기 |

### 2.2 Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 100% (7/7)             |
+---------------------------------------------+
|  ✅ 완전 구현:  7 항목 (100%)               |
|  ⚠️ 부분 구현:  0 항목 (0%)                 |
|  ❌ 미구현:     0 항목 (0%)                  |
+---------------------------------------------+
```

---

## 3. 상세 구현 분석

### 3.1 도착 예정 시각 (항목 1)

`RouteResultPanel.jsx`의 `arrivalTimeStr(totalMin)` 함수가 현재 시각에 소요시간을 더하여
"오전/오후 HH:MM 도착" 형식으로 표시한다.
`RouteCard` 헤더 영역(line 155)에서 `route-card__arrival` 클래스로 렌더링된다.
`SelectedRoutePanel.jsx`(line 129)에서도 동일 로직으로 상세 뷰에 도착 시각을 표시한다.

### 3.2 스왑 버튼 (항목 2)

`RouteSearchPanel.jsx`의 `handleSwap()`(line 104-114)이 `depSelected/destSelected`와
`depQuery/destQuery`를 교차 할당한다. 스왑 후 suggestions를 초기화하여 UI 상태를 정리한다.
SVG 상하 화살표 아이콘(line 173-174)과 `route-swap-btn` 클래스로 시각적 어포던스를 제공한다.

### 3.3 경로 상세 뷰 전환 (항목 3)

- **진입**: `RouteResultPanel`의 `RouteCard` 클릭 -> `handleSelectPath` -> `selectedPath` 설정
- **상세 뷰**: `SelectedRoutePanel` 컴포넌트가 `SegmentDetail` 단위로 구간별 상세(출발역/도착역, 정류장 수, 거리) 표시
- **뒤로가기**: `sel-back-btn` 버튼 -> `onBack` -> `setSelectedPath(null)` -> 목록 복귀
- **닫기**: `onClose` -> 경로 탐색 전체 초기화

### 3.4 탑승 대기 시간 chip (항목 4)

- `busApi.js:fetchBoardingTime()`: 경로의 첫 번째 버스 구간 승차 정류소 근처 정류장을 조회하여 해당 노선의 도착 시간을 반환
- `App.jsx:101`: 모든 경로에 대해 병렬로 `fetchBoardingTime` 호출
- `BoardingChip` 컴포넌트: 시계 아이콘 + "N분 후 탑승" / "곧 도착" 텍스트
- 2분 이하 긴급 상태(`boarding-chip--urgent`) 스타일 분기

### 3.5 출발/도착 핀 마커 (항목 5)

`MapView.jsx`의 `makePinIcon(text, bg)` 함수(line 166-176)가 SVG를 동적 생성하여
data URI 형식의 마커 아이콘을 만든다.
- 출발 핀: 하늘색(`#0ea5e9`), "출발" 텍스트
- 도착 핀: 분홍(`#e11d48`), "도착" 텍스트
- `fitBounds`로 전체 경로가 보이도록 자동 줌 조정

### 3.6 도보 구간 점선 (항목 6)

`MapView.jsx`에서 `trafficType === 3`인 구간을 감지하면:
- 색상: `#4b5563` (진회색)
- 스타일: `strokeStyle: 'dash'`
- 선 두께: 4px (대중교통 구간 5px보다 얇음)
- 흰색 테두리 미적용 (`strokeWeight: isDashed ? 0 : 8`)

추가로 T-Map 보행자 경로 API(`getWalkingRoute`)를 통해 실제 보행로 좌표를 반영한다.

### 3.7 노선 배지 색상 (항목 7)

`ArrivalPanel.jsx`의 `routeBadgeStyle(routeNo)` 함수가 노선 번호 패턴으로 5종 유형 분류:

| 유형 | 패턴 | 배경색 | 예시 |
|------|------|--------|------|
| 심야 | N으로 시작 | `#283593` (남색) | N13, N26 |
| 광역 | 9xxx | `#c62828` (적색) | 9403 |
| 간선 | 1~3xx(x) | `#1565c0` (청색) | 100, 370 |
| 지선 | 4~7xxx | `#2e7d32` (녹색) | 4419, 7016 |
| 순환 | 0x 또는 1~2자리 | `#e65100` (주황) | 02, 08 |

`RouteResultPanel.jsx`의 `SegmentRow`에서도 별도 배지 색상 로직(`segmentColor`)이 적용되어
기후동행 가/불가에 따른 색상 구분이 추가로 이루어진다.

---

## 4. Overall Score

```
+---------------------------------------------+
|  Overall Score                               |
+---------------------------------------------+
|  Design Match:      100% (7/7 항목 구현)     |
|  Architecture:       N/A (FE 단독 분석)      |
|  Convention:         N/A (별도 분석 필요)     |
|                                              |
|  Match Rate:        100%  ✅                 |
+---------------------------------------------+
```

---

## 5. Observations (참고 사항)

Plan 검증 기준 외 추가 구현된 기능들:

| 항목 | 구현 위치 | 설명 |
|------|-----------|------|
| 스켈레톤 로딩 | `RouteResultPanel.jsx:20-35` | 경로 탐색 중 3개 스켈레톤 카드 표시 |
| 출발지 선택 | `RouteSearchPanel.jsx:48-96` | "내 위치" 기본값 + 장소 검색으로 변경 가능 |
| 구간 연결 폴리라인 | `MapView.jsx:146-148` | 구간 사이 끊김 방지 연결선 |
| loadLane 실제 도형 | `odsayApi.js:38-62` | ODsay loadLane API로 실제 도로/철도 형상 좌표 사용 |
| 보행자 경로 조회 | `tmapApi.js:61-92` | T-Map 보행자 경로 API로 실제 보행로 좌표 사용 |
| 환승 횟수 표시 | `RouteResultPanel.jsx:144, 165` | 경로 카드에 환승 횟수 메타 정보 표시 |

---

## 6. Next Steps

- [x] 검증 기준 7개 항목 전체 구현 확인 -- Match Rate 100%
- [ ] App.css 디자인 토큰 적용 상태 별도 확인 (시각적 검증 필요)
- [ ] 실기기/브라우저 동작 테스트 (스왑, 상세 뷰 전환, 마커 등)
- [ ] Completion Report 작성 (`ui-ux-improvements.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-17 | Initial gap analysis | Claude (gap-detector) |
