# Plan: mobile-ux

## Overview

**Feature**: 모바일 UX 전면 개선 (카카오맵 수준의 모바일 사용성)
**Level**: Dynamic
**Priority**: High
**Created**: 2026-03-19

## 배경 & 문제 정의

ClimateGo는 버스 정류장 탐색·도착 정보·경로 안내를 제공하는 서비스로, 실사용의 대부분이 모바일 환경에서 발생한다.
그러나 현재 UI 구조는 데스크탑 레이아웃을 모바일에 맞춰 조정한 수준에 머물러 있어 다음과 같은 사용성 문제가 있다.

### 현재 UX 문제점

| # | 문제 | 영향 |
|---|------|------|
| P1 | **상단 고정 헤더**(로고 + 검색바 + 필터 버튼)가 지도 공간을 상시 차지 | 지도 가시 영역 축소, 이질감 |
| P2 | **드래그 핸들이 시각적으로만 존재** — 터치 드래그 제스처 미구현 | 패널 높이 조절 불가 |
| P3 | **바텀 시트 고정 높이** — ArrivalPanel(65vh), RouteResultPanel(60vh), SelectedRoutePanel(75vh) | 사용자 의도에 맞게 조절 불가 |
| P4 | **ClimateRoutesPanel / FavoritesPanel**이 지도 위 소형 플로팅 카드로 표시 | 지도를 가리고 탭 맥락 없이 돌출 |
| P5 | **경로 검색 패널**이 모바일에서 `top:0` 전체 오버레이 — 지도 완전 차폐 | 이동 중 출발지 확인 불가 |
| P6 | **네비게이션 구조 없음** — 주변/경로/즐겨찾기 간 전환이 상태 기반으로 불명확 | 맥락 파악 어려움 |
| P7 | **GPS/필터 버튼 위치** — 헤더 또는 지도 하단 고정으로 패널과 겹침 | 패널 열릴 때 버튼 가려짐 |

---

## 목표 (Goal)

> 카카오맵·네이버지도 수준의 모바일 퍼스트 UX를 달성한다.

- **지도 = 전체화면**: 지도가 항상 배경 전체를 차지하고, UI는 지도 위에 overlay
- **드래그 바텀 시트**: 스냅 포인트(peek → half → full)로 자연스럽게 높이 조절
- **하단 탭 네비게이션**: 주변 / 경로 / 즐겨찾기 탭으로 명확한 컨텍스트 전환
- **Floating 검색바**: 로고+검색바를 지도 위 상단 floating overlay로 변환
- **일관된 컴포넌트**: 모든 패널이 동일한 DraggableBottomSheet 기반으로 통일

---

## 요구사항 (Requirements)

### M-01: 전체화면 맵 + Floating 검색바

**현재**: `display:flex; flex-direction:column` — 헤더가 지도 위를 점유
**목표**: 헤더 제거 → 검색바를 지도 위 floating overlay로

- `app` 레이아웃을 `position:relative; height:100dvh`로 변경
- 검색바가 지도 위에 `position:absolute; top: safe-top + 12px` 로 overlay
- 로고 아이콘을 검색바 왼쪽에 통합 (36×36 원형 버튼)
- 경로 검색 모드 전환 시 검색바가 2줄 입력 폼으로 확장

**수용 기준**:
- 지도가 전체 화면(100dvh)을 차지
- 검색바가 지도 위에 투명하게 floating (그림자만)
- iOS Safe Area 대응 유지

---

### M-02: 드래그 가능한 바텀 시트 (DraggableBottomSheet)

**현재**: 고정 높이 바텀 시트, 드래그 제스처 없음
**목표**: 터치 드래그로 높이 조절 가능한 공용 컴포넌트

**스냅 포인트**:
| 이름 | 높이 | 용도 |
|------|------|------|
| peek | 100px + safe-bottom | 핸들 + 타이틀만 노출 (지도 보기 우선) |
| half | 45vh | 기본 열림 상태 |
| full | 85vh | 전체 목록 탐색 |

**동작 규칙**:
- 터치 시작 → 드래그 → 손 뗄 때 가장 가까운 스냅 포인트로 스냅
- 빠른 스와이프 다운(velocity > 400px/s) → peek 또는 닫힘
- 바텀 시트 내부 스크롤이 최상단일 때만 드래그 이전
- `DraggableBottomSheet` 공용 컴포넌트로 추출 → ArrivalPanel, RouteResultPanel, SelectedRoutePanel 모두 사용

**수용 기준**:
- 3개 스냅 포인트 모두 정확히 동작
- 내부 스크롤과 드래그 충돌 없음
- 300ms spring 애니메이션

---

### M-03: 하단 탭 네비게이션 (BottomTabBar)

**현재**: 탭 개념 없음, 상태에 따라 패널이 교체됨
**목표**: 화면 하단 탭바로 명확한 컨텍스트 전환

**탭 구성**:
| 탭 | 아이콘 | 내용 |
|----|--------|------|
| 주변 | 📍 | 기후동행 주변 노선 목록 (현재 ClimateRoutesPanel) |
| 경로 | 🗺 | 경로 검색 진입점 |
| 즐겨찾기 | ⭐ | 즐겨찾기 정류장 목록 (현재 FavoritesPanel) |

**동작 규칙**:
- 탭 선택 시 해당 바텀 시트를 peek 높이로 열림
- 다시 탭 클릭 시 half ↔ peek 토글
- 정류장 마커 클릭 시 ArrivalPanel이 half로 열리며 탭바는 유지
- 경로 결과/선택 상태에서는 탭바 숨김 (경로 패널이 공간 차지)

**수용 기준**:
- 탭 전환 시 현재 활성 컨텍스트가 명확히 표시
- 탭바가 safe-area-inset-bottom 대응
- 지도 컨트롤 버튼과 겹치지 않음

---

### M-04: 지도 컨트롤 FAB 재배치

**현재**: GPS 버튼이 `bottom:90px right:14px` 고정 → 패널과 겹침
**목표**: 지도 우측 중단에 세로 배치, 패널 상태와 무관하게 항상 접근 가능

**배치**:
- GPS 버튼: `right:14px; top: 50%` 수직 중앙 (패널이 열려도 지도 영역 안에 위치)
- 필터 버튼 (기후동행 only): GPS 버튼 위 `top: calc(50% - 54px)`
- 탭바가 열릴 때 GPS 버튼은 탭바 높이만큼 위로 이동

**수용 기준**:
- 패널이 half/full 상태에도 GPS 버튼이 지도 영역 안에 보임
- 탭바가 있을 때 버튼이 탭바에 가려지지 않음

---

### M-05: 경로 검색 UX 개선

**현재**: 모바일에서 RouteSearchPanel이 `top:0` 전체 오버레이
**목표**: 검색바 확장 방식으로 통합 (별도 패널 제거)

- Floating 검색바(M-01)에서 경로 탭 클릭 시 검색바가 2줄 입력 폼으로 inline 확장
- 목적지 검색 제안 목록은 검색바 아래 dropdown
- 검색 완료 시 RouteResultPanel이 바텀 시트(half)로 표시
- 기존 `RouteSearchPanel` 컴포넌트 제거 또는 내부 로직만 재사용

**수용 기준**:
- 경로 검색 중에도 지도 배경이 보임
- 검색 제안이 키보드 위에 올라오도록 `bottom: keyboard-height` 대응

---

## 구현 범위 (Scope)

### In Scope
- `DraggableBottomSheet` 공용 컴포넌트 신규 개발
- `BottomTabBar` 컴포넌트 신규 개발
- `App.jsx` 레이아웃 구조 변경 (헤더 제거 → floating)
- `App.css` 전면 개편 (모바일 퍼스트)
- `HeaderSearch.jsx` → Floating 검색바 + 경로 검색 인라인 확장으로 개편
- `ArrivalPanel`, `RouteResultPanel`, `SelectedRoutePanel` → DraggableBottomSheet 적용
- `ClimateRoutesPanel`, `FavoritesPanel` → 탭 컨텐츠로 이동
- GPS/필터 버튼 위치 재배치

### Out of Scope
- 백엔드 API 변경 없음
- 데스크탑(768px+) 레이아웃은 현행 유지 (모바일 우선 개선)
- 새 기능(알림, 즐겨찾기 노선 등) 추가 없음

---

## 우선순위 & 구현 순서

```
1단계 (기반): DraggableBottomSheet 컴포넌트
2단계 (레이아웃): App.jsx 전체화면 맵 + Floating 검색바
3단계 (네비게이션): BottomTabBar + 패널 통합
4단계 (세부 UX): GPS/필터 FAB 재배치 + 경로 검색 개선
```

---

## 성공 지표 (Success Metrics)

| 지표 | 현재 | 목표 |
|------|------|------|
| 지도 가시 높이 (모바일 375px 기준) | ~265px (헤더 58px 제외) | 375px (100%) |
| 바텀 시트 스냅 포인트 수 | 1 (고정) | 3 (peek/half/full) |
| 탭 네비게이션 유무 | ❌ | ✅ |
| 경로 검색 중 지도 가시 | ❌ | ✅ |

---

## 참고 레퍼런스

- 카카오맵 모바일 앱 UX 패턴
- 네이버지도 모바일 바텀 시트 + 탭 네비게이션
- Apple Maps floating 검색바
