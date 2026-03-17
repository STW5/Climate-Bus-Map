# Plan: 반응형 레이아웃 (2026-03-17)

> 모바일 지원 및 PC에서 패널 겹침 해소

- **작성일**: 2026-03-17
- **레벨**: Dynamic
- **상태**: Plan

---

## 현재 문제

### PC (≥ 768px)
- `arrival-panel`, `route-result-panel`, `sel-route-panel` 모두 `left:16px top:16px` — 완전 겹침
- `climate-panel` (left:16px, bottom:24px)도 arrival-panel 뒤에 가려짐

### Mobile (< 768px)
- `route-result-panel`은 <600px만 bottom sheet 처리, 600~767px 구간 미처리
- `route-search-panel`이 map 위 center floating → 좁은 화면에서 지도 가림
- 여러 bottom sheet 동시 표시 가능 (겹침)

---

## 해결 방향

### 패널 슬롯 분리 (PC)

| 슬롯 | 위치 | 패널 |
|------|------|------|
| Left | left:16px | route-search-panel, route-result-panel, sel-route-panel |
| Right | right:16px | arrival-panel (route 패널 없을 땐 left:16px도 허용) |
| Bottom-left | left:16px, bottom:24px | climate-panel (route/arrival 패널 없을 때만) |

→ arrival-panel을 Desktop에서 **right:16px**로 이동하면 모든 겹침 해소

### Mobile (< 768px)

- **모든 패널 → full-width bottom sheet** (route-result도 포함)
- `route-search-panel` → 상단 full-width (transform 제거, top:0)
- 동시에 열린 bottom sheet 중 **우선순위 높은 것만 표시**
  우선순위: `sel-route > route-result > arrival`
- `climate-panel` → 우측 하단 소형 chip (bottom-right)으로 이동, 다른 패널과 겹치지 않음

---

## 구현 범위

### App.css
- Mobile: `.route-result-panel` bottom sheet 범위를 `< 768px`로 확장
- Mobile: `.route-search-panel` top:0, width:100%, translate 제거
- Mobile: `.climate-panel` position 우측 하단 (right:16px, bottom:90px)
- Desktop: `.arrival-panel` → `right:16px, left:auto`
- Desktop: `sel-route-panel` width을 arrival-panel과 충돌 없도록 유지
- Mobile: `.sel-route-panel` bottom sheet 높이 제한 (max-height: 75vh)

### App.jsx
- Mobile에서 route 패널 열릴 때 arrival 패널 닫기 (`handleClose` 호출)
- `climate-panel`: route 또는 arrival 패널 열려있을 때 mobile에서 숨김

---

## 검증 기준

- [ ] PC: arrival + route-result 패널 동시 표시 시 겹치지 않음
- [ ] PC: sel-route 패널과 arrival 패널 겹치지 않음
- [ ] Mobile: route-result 패널이 bottom sheet으로 표시
- [ ] Mobile: route-search 패널이 지도 상단에 full-width로 표시
- [ ] Mobile: 여러 패널 동시에 열려도 한 번에 하나만 bottom sheet 표시
- [ ] Mobile: climate-panel이 다른 패널 뒤에 가려지지 않음
