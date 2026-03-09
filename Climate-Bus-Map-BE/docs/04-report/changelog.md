# Climate Bus Map - 변경 이력

## [2026-03-09] - Phase 4 차별화 기능 완료

### 추가 (Added)
- BE: `BusApiPort.getNearbyStations()` 메서드 추가 (공공API 추상화)
- BE: `SeoulBusApiAdapter` - `getStationByPos` 공공API 연동 (실제 정류소 조회)
- BE: `GET /api/v1/stations/nearby/climate-routes` 신규 엔드포인트 (주변 기후동행 가능 노선 집계)
- FE: `FilterToggle.jsx` 컴포넌트 (D-01 기후동행 필터 토글)
- FE: `ClimateRoutesPanel.jsx` 컴포넌트 (D-02 주변 이용 가능 노선 패널)
- FE: `fetchNearbyClimateRoutes()` API 함수
- BE: `NearbyStationDto.arsId` 필드 (정류소 고유번호)

### 변경 (Changed)
- FE: `fetchNearbyStations()` 목 데이터 → 실 공공API 전환
- BE: `StationService.getNearbyStations()` 목 데이터 로직 제거 → 실 API 연동
- BE: `StationService` 캐싱 전략 추가 (`@Cacheable`)
- FE: `App.jsx` 필터 상태 관리 + climate-routes API 통합

### 수정 (Fixed)
- BE: 트래픽 관리 - 최대 10개 정류소 제한
- BE: 내결함성 - 개별 도착정보 조회 실패 시 skip (전체 실패 방지)

### 기술적 개선 (Technical Improvements)
- 헥사고날 아키텍처 일관성 유지 (Port/Adapter 패턴)
- 공공API XML 파싱 및 데이터 변환
- 캐싱 전략으로 API 호출 최적화
- FE 컴포넌트 분리로 재사용성 강화
- Error handling 및 loading 상태 관리

### 설계 일치도 (Design Match Rate)
- **목표**: ≥ 90%
- **달성**: 93%
- **상태**: ✅ 통과

### 완료 기준 (Definition of Done)
- ✅ 실제 공공API 연동 (`getStationByPos`)
- ✅ 기후동행 필터 토글 UI 구현
- ✅ 주변 기후동행 노선 추천 패널 구현
- ✅ 백엔드 API 응답 정합성 검증
- ✅ FE 통합 테스트 (필터링 로직 검증)

### 주요 변경사항
| 항목 | Design | Implementation | 비고 |
|------|--------|----------------|------|
| FilterToggle 위치 | 지도 상단 중앙 | 헤더 우측 | UX 개선 |
| 정류소 조회 | 모의 API | 실제 공공API | Phase 3 → Phase 4 |
| 응답 포맷 | JSON | XML 파싱 | 기존 코드 재사용 |

### 보고서
- 완료 보고서: `docs/04-report/features/climate-bus-map-phase4.report.md`
- Gap 분석 보고서: `docs/03-analysis/climate-bus-map-phase4.analysis.md`

---

## [2026-03-07] - Phase 3 Frontend MVP 완료

### 추가 (Added)
- React 18 기반 Climate Bus Map Frontend MVP 구현
- T-Map Web SDK v2 지도 렌더링 기능
- 정류장 마커 표시 및 클릭 인터랙션
- 도착 버스 정보 패널 (슬라이드 UI)
- 기후동행 배지 (🟢/🔴) 표시
- GPS 기반 현재 위치 감지 (`useGeolocation` 훅)
- 백엔드 API (`/api/v1/stations/{stationId}/arrivals`) 실제 연동
- 목 정류장 데이터 5개소 하드코딩 (stationInfo API 대기)

### 변경 (Changed)
- N/A

### 수정 (Fixed)
- N/A

### 기술적 개선 (Technical Improvements)
- 에러 상태 관리 및 사용자 피드백 UI 추가
- 지도/마커 리소스 정리 (cleanup) 로직 구현
- geolocation 미지원 환경 대비 방어 코드 추가
- geolocation 5초 타임아웃 설정
- ClimateBadge 텍스트 레이블 추가 (UX 개선)
- CSS 스타일링 및 반응형 레이아웃
- 환경변수 기반 API 키 관리 (.env, .env.example)

### 설계 일치도 (Design Match Rate)
- **목표**: ≥ 90%
- **달성**: 93%
- **상태**: ✅ 통과

### 완료 기준 (Definition of Done)
- ✅ `npm run dev` → 브라우저에서 T-Map 지도 표시
- ✅ 정류장 마커 클릭 → 도착 패널 표시
- ✅ `climateEligible: true` → 🟢 / `false` → 🔴 배지 표시
- ✅ `/api/v1/stations/{stationId}/arrivals` 실제 연동

### 프로젝트 구조
```
Climate-Bus-Map-FE/
├── src/
│   ├── api/busApi.js
│   ├── components/
│   │   ├── MapView.jsx
│   │   ├── ArrivalPanel.jsx
│   │   └── ClimateBadge.jsx
│   ├── hooks/useGeolocation.js
│   ├── data/mockStations.js
│   ├── App.jsx
│   └── main.jsx
├── .env
├── index.html
└── vite.config.js
```

### 보고서
- 완료 보고서: `docs/04-report/features/phase3.report.md`
- Gap 분석 보고서: `docs/03-analysis/phase3.analysis.md`

---

## 다음 단계 (Next Steps)

### 즉시 실행
- [ ] 빌드 및 배포 검토
- [ ] 성능 테스트
- [ ] 기술 문서 작성

### Phase 3-2 (다음 사이클)
- [ ] stationInfo API 실제 연동 (API 등록 후)
- [ ] 슬라이드 애니메이션 개선 (Framer Motion)
- [ ] 테스트 코드 작성 (Jest + React Testing Library)
- [ ] 모바일 최적화

### Phase 4 (향후 계획)
- 버스 노선 정보 화면
- 즐겨찾기 기능
- 알림 기능

---

> **PDCA 사이클 완료**: Plan → Design → Do → Check → Act
>
> **Match Rate**: 93% (목표 90% 달성)
>
> **상태**: ✅ Complete
