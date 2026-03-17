# Design: 경로탐색 결과 UI 개선

- **작성일**: 2026-03-17
- **상태**: 진행 중

---

## 1. 컴포넌트 구조

```
RouteResultPanel
├── 헤더 (결과 N개 + 닫기)
└── 카드 목록
    └── RouteCard (per path)
        ├── 상단: 총 소요시간 + 기후동행 뱃지
        ├── 구간 바 (비율 시각화)
        └── 구간 상세 목록 (trafficType별)
```

---

## 2. RouteCard 상세 설계

### 2-1. 구간 바 (Segment Bar)

```
[버스 30%][지하철 50%][도보 20%]
```

- 각 구간 `sectionTime / totalTime` 비율로 너비 결정
- 색상:
  - 버스(기후동행): `#1a6b3a` (초록)
  - 버스(불가): `#d32f2f` (빨강)
  - 지하철(기후동행): `#1a56c4` (파랑)
  - 지하철(불가): `#d32f2f` (빨강)
  - 도보: `#bdbdbd` (회색)

### 2-2. 구간 상세 행

```
🚶 도보 3분          →  [회색 작은 텍스트]
🚌 472번  7분 · 4정류장  →  [초록 뱃지 + 시간 + 정류장수]
🚇 2호선  12분 · 6정류장 →  [파랑 뱃지 + 시간 + 정류장수]
🚶 도보 2분          →  [회색 작은 텍스트]
```

### 2-3. 총 요약 행

```
35분   도보 400m   4정류장
```

---

## 3. 애니메이션 설계

| 대상 | 효과 | 값 |
|------|------|----|
| 패널 등장 | slide-up + fade | `0.35s cubic-bezier(0.32,0.72,0,1)` |
| 카드 hover | scale + shadow | `scale(1.01), shadow-md` |
| 카드 선택 | left accent bar | `3px solid var(--green-primary)` |
| 구간 바 | width animate on mount | `0.4s ease` |

---

## 4. 색상 토큰 추가

```css
--blue-primary: #1a56c4;
--blue-light:   #e8f0fe;
--walk-color:   #9e9e9e;
--segment-radius: 3px;
```

---

## 5. 구현 순서

1. `RouteResultPanel.jsx` — 구간 바 + 상세 행 재설계
2. `App.css` — 애니메이션 + 색상 토큰 추가
