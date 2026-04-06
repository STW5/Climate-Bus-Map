# Climate Bus Map — Claude 행동 규칙

## 프로젝트 개요
- 서울 기후동행카드 지원 버스/지하철 경로 안내 서비스
- 모노레포: BE (Spring Boot) + FE (React + Vite)
- Git root: `/Users/stw/Dev/Climate-Bus-Map`

## 절대 금지 사항

### 배포
- `deploy-fe.sh` 절대 실행 금지 — CI/CD가 있음, rsync 직접 배포 금지
- 배포는 항상 `git commit` + `git push origin main`으로만

### 커밋 메시지
- 영어 커밋 메시지 금지 → 반드시 한국어
- "with claude", "by claude" 문구 금지
- "phase3", "Phase 3" 등 phase 번호 금지
- `Co-Authored-By` 줄 금지
- 좋은 예: `feat: 버스 도착 정보 조회 API 구현`
- 나쁜 예: `feat: Phase 3 프론트엔드 구현 with claude`

### 코드 수정
- 요청하지 않은 리팩토링, 주석 추가, 타입 어노테이션 추가 금지
- 사용하지 않는 import 제거 외에 코드 정리 금지
- 새 파일 생성은 꼭 필요한 경우에만

## 아키텍처 규칙

### BE (Spring Boot)
- Hexagonal Architecture 준수
  - `domain/` — 순수 도메인 로직, 외부 의존 없음
  - `web/` — Inbound Adapter (Controller)
  - `external/` — Outbound Adapter (외부 API)
  - `config/` — 설정
- 패키지: `com.stw.climatebusmapbe`
- 새 기능은 반드시 도메인 레이어부터 설계

### FE (React + Vite)
- React 18 + Vite
- T-Map Web SDK v2: 반드시 `useTmapReady` hook으로 동적 로드
- FE 포트: 3000 (BE CORS 설정과 맞춤)
- 환경변수: `VITE_` prefix

## 기술 스택 & 키 정보
- 공공 API 키: `7c3ccdd52aa1a760b60bbc0a5c829f896105b1f77efaafd8badbaa150986d860`
- ODsay API 키: `VITE_ODSAY_API_KEY` (FE .env)
- 서울 버스 API: `ws.bus.go.kr`

## 작업 순서
1. 파일 읽기 → 2. 이해 → 3. 수정 (읽지 않고 수정 금지)
2. 수정 범위는 요청된 것만
3. 보안 취약점 (SQL Injection, XSS 등) 절대 도입 금지
