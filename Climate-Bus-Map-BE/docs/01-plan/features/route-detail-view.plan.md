# Plan: 경로 선택 시 상세 뷰 전환

> 경로 카드 선택 → 탐색 패널 숨김 + 선택 경로 상세 패널 표시 (카카오맵 방식)

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 현재 문제

- 경로 카드 선택 시 RouteSearchPanel + RouteResultPanel이 그대로 남음
- 지도가 폴리라인을 그리지만 UI가 겹쳐 지도를 가림
- 선택된 경로의 상세 정보(정류소 간 이동, 구간별 역)가 없음

---

## 2. 카카오맵 벤치마크

| 단계 | UI 상태 |
|------|---------|
| 검색 전 | 검색 버튼만 |
| 결과 목록 | 검색창 + 카드 목록 |
| 경로 선택 | 검색창/목록 숨김 → 상세 패널 (지도 최대 노출) |
| 뒤로 가기 | 목록으로 복귀 |

---

## 3. 구현 방법

### 렌더링 조건 변경 (App.jsx)
```
selectedPath === null → RouteSearchPanel + RouteResultPanel 표시
selectedPath !== null → SelectedRoutePanel 표시 (둘 다 숨김)
```

### SelectedRoutePanel 컴포넌트
- 위치: 하단 bottom sheet (mobile) / 좌측 패널 (desktop)
- 헤더: `← 목록` 버튼 | 소요시간 | 도착 예정 시각
- 탑승 대기 chip + 기후동행 badge
- SegmentBar (시각적 요약)
- 구간 상세 리스트:
  - 버스/지하철: 아이콘 + 노선명 + 출발역→도착역 + 정류장 수 + 소요시간
  - 도보: 아이콘 + 거리 + 소요시간

### 뒤로 가기
- `setSelectedPath(null)` → RouteResultPanel 목록으로 복귀

---

## 4. 구현 파일

| 파일 | 변경 |
|------|------|
| `src/components/SelectedRoutePanel.jsx` | 신규 생성 |
| `src/App.jsx` | 조건부 렌더링 변경, selectedBoardingTime state 추가 |
| `src/App.css` | SelectedRoutePanel 스타일 추가 |

---

## 5. 범위

- FE 전용, BE 변경 없음
- RouteResultPanel/RouteSearchPanel 로직 변경 없음
