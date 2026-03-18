# ClimateGo — 기후동행카드 버스 지도

서울시 **기후동행카드** 사용 가능 버스 노선을 지도에서 실시간으로 확인하고, 출발지-도착지 경로 탐색 시 기후동행카드 사용 가능 여부를 판단해주는 웹 서비스입니다.

## 주요 기능

- **주변 정류장 조회** — 현재 위치(GPS) 기준 반경 500m 이내 버스 정류장 표시
- **기후동행 노선 필터** — 기후동행카드 사용 가능 버스만 필터링하여 표시
- **실시간 버스 도착 정보** — 정류장 선택 시 각 노선의 도착 예정 시간 표시 (30초 자동 갱신)
- **경로 탐색** — 출발지-도착지 입력 시 대중교통 경로 탐색 및 기후동행카드 사용 가능 여부 판단
- **실시간 내 위치 표시** — GPS 기반 파란 점 마커로 현재 위치 실시간 갱신

## 기술 스택

### Backend
- **Spring Boot 4.0** (Java 17)
- **PostgreSQL 16** — 기후동행 가능 버스 노선 DB
- **Caffeine Cache** — API 응답 캐싱 (기후동행 노선 목록 1시간)
- **Hexagonal Architecture**
- 서울 공공데이터 버스 API (`ws.bus.go.kr`)

### Frontend
- **React 19** + **Vite 7**
- **T-Map Web SDK v2** — 지도, 마커, 폴리라인
- **ODsay API** — 대중교통 경로 탐색
- GPS `watchPosition` — 실시간 위치 추적

### 인프라
- **Docker Compose** — 3개 컨테이너 (postgres, backend, frontend)
- **nginx** — FE 정적 파일 서빙 + SPA fallback
- **GitHub Actions** — main 브랜치 push 시 서버 자동 배포

## 로컬 실행

### 사전 준비

- Java 17+
- Node.js 20+
- Docker & Docker Compose
- 서울 버스 API 키 ([data.go.kr](https://www.data.go.kr) 발급)
- T-Map API 키
- ODsay API 키

### 환경변수 설정

```bash
cp .env.example .env
# .env 파일에 실제 값 입력
```

```env
DB_USERNAME=climatebus
DB_PASSWORD=your_password
SEOUL_BUS_API_KEY=your_key
TMAP_API_KEY=your_key
```

프론트엔드 환경변수 (`Climate-Bus-Map-FE/.env.local`):

```env
VITE_API_BASE_URL=http://localhost:8082
VITE_TMAP_API_KEY=your_tmap_key
VITE_ODSAY_API_KEY=your_odsay_key
```

### Docker로 실행

```bash
docker compose up -d
```

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost:3002 |
| 백엔드 API | http://localhost:8082 |
| PostgreSQL | localhost:5443 |

### 개발 서버 실행

```bash
# Backend
cd Climate-Bus-Map-BE
./gradlew bootRun

# Frontend
cd Climate-Bus-Map-FE
npm install
npm run dev   # http://localhost:3000
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/stations/nearby` | 주변 정류장 조회 (`lat`, `lng`, `radius`) |
| GET | `/api/v1/stations/nearby/climate-routes` | 주변 기후동행 노선 정류장 조회 |
| GET | `/api/v1/stations/{stationId}/arrivals` | 정류장 실시간 버스 도착 정보 |
| GET | `/api/v1/climate-routes` | 기후동행 가능 전체 노선 목록 |
| GET | `/api/v1/routes/climate-eligible` | 기후동행 가능 노선 ID 목록 (캐시) |

## 배포

main 브랜치에 push하면 GitHub Actions가 서버에 자동 배포합니다.

필요한 GitHub Secrets:

| Secret | 설명 |
|--------|------|
| `SERVER_HOST` | 서버 호스트 |
| `SERVER_USER` | SSH 사용자명 |
| `SERVER_SSH_KEY` | SSH 개인키 |

## 프로젝트 구조

```
Climate-Bus-Map/
├── Climate-Bus-Map-BE/          # Spring Boot 백엔드
│   └── src/main/java/.../
│       ├── station/             # 정류장 조회
│       ├── arrival/             # 버스 도착 정보
│       ├── route/               # 기후동행 노선
│       ├── external/            # 외부 API 클라이언트
│       └── config/              # CORS, Cache 설정
├── Climate-Bus-Map-FE/          # React 프론트엔드
│   └── src/
│       ├── components/          # UI 컴포넌트
│       ├── hooks/               # useGeolocation, useTmapReady 등
│       ├── utils/               # climateChecker.js (기후동행 판단)
│       └── api/                 # API 클라이언트
├── docker-compose.yml
└── .github/workflows/deploy.yml
```
