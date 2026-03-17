# Plan: UI 테마 하늘색 변경

> 현재 초록 기반 테마를 하늘색(sky blue) 계열로 전면 교체

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 문제 정의

현재 앱 전반의 주요 색상이 초록(`#1a6b3a`)으로 기후동행 브랜드와 연관성은 있으나,
지도 앱 특성상 하늘색이 더 직관적이고 현대적인 느낌을 준다.

---

## 2. 변경 범위

### CSS 토큰 변경 (App.css)
| 기존 | 변경 |
|------|------|
| `--green-primary: #1a6b3a` | `--sky-primary: #0ea5e9` |
| `--green-light: #e8f5e9` | `--sky-light: #e0f2fe` |
| `--green-dim: #c8e6c9` | `--sky-dim: #bae6fd` |

### 적용 대상
- Header (배경, 버튼)
- FilterToggle (활성 상태)
- ClimateRoutesPanel (배지, 헤더)
- ArrivalPanel (기후동행 표시)
- RouteResultPanel (기후동행 구간 색)
- MapView 폴리라인 (버스 기후동행 구간)

---

## 3. 구현 계획

1. `App.css` — 토큰 변경 및 참조 업데이트
2. `FilterToggle.jsx/css` — active 색상 변경
3. `ClimateRoutesPanel.jsx/css` — 배지 색상 변경
4. `ArrivalPanel.jsx/css` — climate 표시 색상 변경
5. `MapView.jsx` — 버스 폴리라인 색상 변경

---

## 4. 범위

- FE 전용, BE 변경 없음
- 기후동행 불가(빨강), 지하철(파랑), 도보(회색)는 유지
- 버스 기후동행 구간: 초록 → 하늘색
