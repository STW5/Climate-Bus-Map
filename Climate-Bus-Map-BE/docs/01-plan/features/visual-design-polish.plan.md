# Plan: 시각 디자인 품질 개선

> 기능 위주의 UI에서 카카오맵 수준의 시각적 완성도로 끌어올리기

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 현재 문제

- 입력창: 구분이 없는 평평한 텍스트 박스
- 검색 제안: 아이콘 없는 단순 텍스트 목록
- RouteCard: 이모지(🚌🚇🚶) 사용, 구간 정보 밀도 낮음
- ClimateRoutesPanel: 🟢 이모지 사용, 카드 느낌 없음
- 전반: 그림자/레이어 부족, depth 없음, 인터랙션 피드백 약함

---

## 2. 개선 항목

### V-01: RouteSearchPanel
- 출발 · 도착 컬러 dot (파랑 / 빨강) + 점선 수직 연결
- 검색 제안에 위치 핀 아이콘 + 장소명/주소 구분 타이포

### V-02: RouteCard 구간 표시
- 이모지 → SVG 아이콘 (버스/지하철/도보)
- SegmentBar 두께 8px, 라운드 캡
- 구간 뱃지에 노선 색상 반영

### V-03: ArrivalPanel 도착 정보
- 도착 시간 숫자 크게 + "분" 단위 작게 분리
- 2번째 버스 arrival-second 스타일 구분 강화
- 노선 배지 pill 형태로 통일

### V-04: ClimateRoutesPanel
- 이모지 제거 → 색상 dot SVG
- 노선 번호 배지 + 유형 텍스트 레이아웃 정리

### V-05: 전반 polish
- 검색 결과 패널 헤더 그라데이션 액센트 라인
- 버튼 hover/active 상태 더 명확하게
- 경로 탐색 버튼 subtle gradient
- focus ring 통일 (outline 대신 box-shadow)

---

## 3. 구현 파일

| 항목 | 파일 |
|------|------|
| V-01 | `RouteSearchPanel.jsx`, `App.css` |
| V-02 | `RouteResultPanel.jsx`, `App.css` |
| V-03 | `ArrivalPanel.jsx`, `App.css` |
| V-04 | `ClimateRoutesPanel.jsx`, `App.css` |
| V-05 | `App.css` |

---

## 4. 범위

- FE 전용, 로직 변경 없음
- 기존 className 구조 최대한 유지
