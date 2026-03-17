# Plan: UX 개선 — 카카오맵/네이버 지도 벤치마킹

> 카카오맵·네이버 지도의 핵심 UX 패턴을 참고하여 경로탐색·정류소 패널의 사용성 향상

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 벤치마킹 분석

### 카카오맵의 강점
- **도착 예정 시각 표시**: "N분" 대신 "오후 3:42 도착" 형태
- **출발↔도착 스왑 버튼**: 경로 방향 뒤집기 1탭
- **Bottom Sheet 드래그**: 정류소/경로 패널을 스와이프로 크기 조절
- **교통수단 아이콘 + 색상 배지**: 텍스트만이 아닌 시각적 식별

### 네이버 지도의 강점
- **환승 횟수 한눈에**: 카드 상단에 "2회 환승" 표시
- **총 도보 거리**: "도보 800m"를 별도 강조
- **구간별 소요 시간 + 노선명 인라인**: 각 구간 오른쪽에 시간 표시

### 현재 앱의 주요 UX 문제
1. RouteCard: 총 시간(N분)만 있고 도착 예정 시각 없음
2. RouteSearchPanel: 출발↔도착 스왑 버튼 없음
3. ArrivalPanel: 정류장 ID 노출 (사용자에게 무의미)
4. RouteResultPanel: 경로 탐색 중 빈 화면 (스켈레톤 없음)
5. ArrivalPanel drag handle: UI는 있지만 실제 드래그 미동작
6. 환승 횟수가 카드에 표시되지 않음
7. 경로 결과 패널과 검색 패널이 겹쳐 혼란스러운 z-index

---

## 2. 개선 항목 (우선순위 순)

### U-01: 도착 예정 시각 표시 (RouteCard)
- `총 N분` → `N분 · 오후 H:MM 도착` 형태 병기
- `new Date(Date.now() + totalTime * 60000)` 로 계산

### U-02: 출발↔도착 스왑 버튼 (RouteSearchPanel)
- 출발/도착 행 사이에 ↕ 버튼 추가
- 클릭 시 두 값 교환 (state swap)

### U-03: ArrivalPanel 불필요 정보 제거
- "정류장 ID XXXXXXX" 라인 제거
- 노선 배지에 색상 구분 (간선/지선/광역) 추가 — routeNo 앞자리로 판별

### U-04: 경로 탐색 중 스켈레톤 (RouteResultPanel)
- paths.length === 0 && loading 상태에 SkeletonCard 3개 표시
- 기존 ArrivalPanel의 SkeletonRow 패턴 재활용

### U-05: 환승 횟수 + 도보 거리 표시 (RouteCard)
- subPaths에서 trafficType !== 3인 구간 수 - 1 = 환승 횟수
- `totalWalk` → `총 도보 N분` (m → 도보 분 환산: 80m/min)

### U-06: Bottom Sheet 드래그 인터랙션 (ArrivalPanel)
- touch/mouse 이벤트로 drag handle 동작 구현
- 스냅 위치: 축소(64px) / 절반(45vh) / 전체(85vh)
- 드래그 속도로 snap 방향 결정

---

## 3. 구현 파일

| 항목 | 파일 | 변경 내용 |
|------|------|-----------|
| U-01 | `RouteResultPanel.jsx` | RouteCard에 도착 예정 시각 추가 |
| U-02 | `RouteSearchPanel.jsx` | 스왑 버튼 추가 |
| U-03 | `ArrivalPanel.jsx` | 정류장 ID 제거, 노선 배지 색상 |
| U-04 | `RouteResultPanel.jsx` | 로딩 스켈레톤 추가 |
| U-05 | `RouteResultPanel.jsx` | 환승 횟수, 도보 거리 표시 |
| U-06 | `ArrivalPanel.jsx` | 드래그 인터랙션 구현 |
| 공통 | `App.css` | 새 스타일 추가 |

---

## 4. 범위

- FE 전용, BE 변경 없음
- 기존 API 응답 구조 변경 없음
- U-01~U-05: 빠른 구현 (스타일/로직 위주)
- U-06: 인터랙션 구현으로 난이도 높음 → 별도 작업

---

## 5. 미구현 항목 (이유)

- **혼잡도 표시**: 공공 API에 혼잡도 데이터 없음
- **승하차 알림**: Phase 6 알림 기능으로 연기됨
- **최근 검색 기록**: localStorage 연동 필요, 추후 검토
