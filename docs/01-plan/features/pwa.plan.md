# Plan: PWA (Progressive Web App)

## 개요

ClimateGo를 모바일에서 네이티브 앱처럼 사용할 수 있도록 PWA를 적용한다.

## 기능 범위

### PWA-01. 홈 화면 설치
- 모바일 Safari/Chrome에서 "홈 화면에 추가" 지원
- 앱 아이콘, 스플래시 스크린
- 전체화면 실행 (주소창 없음)

### PWA-02. 서비스 워커 캐시
- 앱 셸(JS/CSS/HTML) 오프라인 캐시
- 지도 타일 및 API 응답 캐시 (네트워크 우선, 오프라인 fallback)

### PWA-03. 설치 배너
- 데스크톱/Android Chrome: 설치 프롬프트 자동 표시

## 기술 접근

- `vite-plugin-pwa` 사용 (Workbox 기반)
- Web App Manifest: 이름, 아이콘, 테마색, display: standalone
- 캐시 전략: App shell → CacheFirst, API → NetworkFirst

## 성공 기준

- [ ] 모바일 홈 화면 추가 후 전체화면 실행
- [ ] 오프라인 상태에서 앱 셸 로드
- [ ] Lighthouse PWA 점수 90+
