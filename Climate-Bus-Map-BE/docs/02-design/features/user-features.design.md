# Design: 사용자 기능 — 로그인 · 즐겨찾기 동기화 · 경로 저장 · 알림 · 통계

- **작성일**: 2026-03-20
- **참조 Plan**: docs/01-plan/features/user-features.plan.md
- **변경 이력**: 2026-03-20 — OAuth 제거, 자체 이메일/비밀번호 로그인으로 변경

---

## 0. 로그인 전략

- **자체 로그인** (이메일 + 비밀번호) — OAuth는 추후 추가
- **비로그인도 앱 전체 기능 사용 가능** (로그인은 즐겨찾기 동기화 등 선택적 기능)
- 비밀번호 해시: BCrypt
- JWT HttpOnly Cookie 방식 유지

---

## 1. 전체 구조

```
Client (React PWA)
  │
  ├─ AuthContext ─────────────── JWT (HttpOnly Cookie)
  │
  ├─ /api/v1/auth/*  ──────────── 회원가입 / 로그인 / 갱신 / 로그아웃
  ├─ /api/v1/favorites  ───────── 즐겨찾기 동기화
  ├─ /api/v1/saved-routes  ────── 경로 저장
  ├─ /api/v1/push/*  ─────────── Web Push 구독/설정
  ├─ /api/v1/stats/*  ────────── 통계
  │
Spring Boot (Hexagonal)
  │
  ├─ domain/user          User (이메일/비밀번호)
  ├─ domain/favorite      Favorite
  ├─ domain/savedroute    SavedRoute
  ├─ domain/alert         PushSubscription + AlertSetting
  ├─ domain/stat          RideLog
  │
  └─ PostgreSQL (JPA)
```

---

## 2. DB 스키마

### users
```sql
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(200) NOT NULL UNIQUE,
    password_hash   VARCHAR(100) NOT NULL,     -- BCrypt
    nickname        VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### favorites
```sql
CREATE TABLE favorites (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    station_id    VARCHAR(50) NOT NULL,
    station_name  VARCHAR(100) NOT NULL,
    ars_id        VARCHAR(20),
    lat           DOUBLE PRECISION NOT NULL,
    lng           DOUBLE PRECISION NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, station_id)
);
```

### saved_routes
```sql
CREATE TABLE saved_routes (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,       -- e.g. "집→회사"
    start_name    VARCHAR(100) NOT NULL,
    end_name      VARCHAR(100) NOT NULL,
    route_json    JSONB NOT NULL,              -- ODsay 경로 결과 + 좌표
    created_at    TIMESTAMP DEFAULT NOW()
);
-- 최대 10개 제약은 서비스 레이어에서 처리
```

### push_subscriptions
```sql
CREATE TABLE push_subscriptions (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint      TEXT NOT NULL UNIQUE,
    p256dh        TEXT NOT NULL,
    auth          TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);
```

### alert_settings
```sql
CREATE TABLE alert_settings (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    station_id    VARCHAR(50) NOT NULL,
    station_name  VARCHAR(100) NOT NULL,
    route_id      VARCHAR(50) NOT NULL,
    route_name    VARCHAR(50) NOT NULL,
    minutes_before INT NOT NULL DEFAULT 5,    -- 도착 N분 전 알림
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (user_id, station_id, route_id)
);
-- 최대 3개 제약은 서비스 레이어에서 처리
```

### ride_logs
```sql
CREATE TABLE ride_logs (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ride_date     DATE NOT NULL,
    route_id      VARCHAR(50) NOT NULL,
    route_name    VARCHAR(50) NOT NULL,
    station_id    VARCHAR(50),
    created_at    TIMESTAMP DEFAULT NOW()
);
```

---

## 3. F-01: 자체 로그인 (이메일/비밀번호)

### API

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/v1/auth/signup | 회원가입 |
| POST | /api/v1/auth/login | 로그인 → JWT Cookie 세팅 |
| POST | /api/v1/auth/refresh | Access Token 재발급 |
| POST | /api/v1/auth/logout | Cookie 삭제 |
| GET | /api/v1/auth/me | 내 정보 조회 (FE 로그인 상태 확인용) |

### 요청/응답

```json
// POST /api/v1/auth/signup
{ "email": "user@example.com", "password": "abc123!", "nickname": "홍길동" }
→ 200 { "id": 1, "email": "...", "nickname": "..." }
// 중복 이메일 → 409

// POST /api/v1/auth/login
{ "email": "user@example.com", "password": "abc123!" }
→ 200 { "nickname": "홍길동" }
  Set-Cookie: access_token=...; HttpOnly; SameSite=Lax; Max-Age=3600
  Set-Cookie: refresh_token=...; HttpOnly; SameSite=Lax; Max-Age=604800
// 실패 → 401

// GET /api/v1/auth/me
→ 200 { "id": 1, "email": "...", "nickname": "..." }
// Cookie 없거나 만료 → 401 (FE에서 비로그인 처리)
```

### 신규 파일 (BE)

```
domain/user/
  User.java              — @Entity (id, email, passwordHash, nickname, createdAt)
  UserRepository.java    — JpaRepository
  UserService.java       — signup(), login() → BCrypt 검증

web/auth/
  AuthController.java    — 위 API 엔드포인트
  AuthRequest.java       — signup/login DTO
  AuthResponse.java      — 응답 DTO

common/security/
  JwtProvider.java       — 발급(userId) / 검증 / 파싱
  JwtAuthFilter.java     — OncePerRequestFilter (Cookie에서 access_token 추출)
  SecurityConfig.java    — permitAll 경로 설정
```

### JWT 스펙

| 항목 | 값 |
|------|----|
| Access Token TTL | 1시간 |
| Refresh Token TTL | 7일 |
| 저장 위치 | HttpOnly Cookie (`access_token`, `refresh_token`) |
| Refresh 방식 | POST /api/v1/auth/refresh (Cookie 자동 전송) |

### SecurityConfig permitAll 경로

```java
.requestMatchers("/api/v1/auth/**").permitAll()
.requestMatchers(HttpMethod.GET, "/api/v1/stations/**").permitAll()
.requestMatchers(HttpMethod.GET, "/api/v1/routes/**").permitAll()
// 나머지는 인증 필요 (401 반환 → FE에서 비로그인 UI로 graceful 처리)
```

### 의존성 추가 (build.gradle)

```groovy
implementation 'org.springframework.boot:spring-boot-starter-security'
implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.6'
runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.6'
```

---

## 4. F-02: 즐겨찾기 서버 동기화

### API

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/v1/favorites | 내 즐겨찾기 목록 |
| POST | /api/v1/favorites | 즐겨찾기 추가 |
| DELETE | /api/v1/favorites/{stationId} | 즐겨찾기 삭제 |
| POST | /api/v1/favorites/bulk | localStorage 마이그레이션 (배열) |

### 요청/응답

```json
// POST /api/v1/favorites
{ "stationId": "118000009", "stationName": "종로5가", "arsId": "01-001", "lat": 37.571, "lng": 127.002 }

// GET /api/v1/favorites 응답
[{ "stationId": "...", "stationName": "...", "arsId": "...", "lat": ..., "lng": ... }]

// POST /api/v1/favorites/bulk
[{ "stationId": "...", ... }, ...]  // 중복은 무시(UPSERT)
```

### FE 분기 로직

```js
// favoritesApi.js
export const getFavorites = async (isLoggedIn) => {
  if (!isLoggedIn) return getLocalFavorites();
  return await GET('/api/v1/favorites');
};

export const addFavorite = async (station, isLoggedIn) => {
  if (!isLoggedIn) return addLocalFavorite(station);
  return await POST('/api/v1/favorites', station);
};
```

### 첫 로그인 마이그레이션

```js
// AuthContext.js — 로그인 성공 후
const local = getLocalFavorites();
if (local.length > 0) {
  await POST('/api/v1/favorites/bulk', local);
  clearLocalFavorites();
}
```

---

## 5. F-03: 경로 저장

### API

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/v1/saved-routes | 저장된 경로 목록 |
| POST | /api/v1/saved-routes | 경로 저장 |
| DELETE | /api/v1/saved-routes/{id} | 경로 삭제 |

### 요청/응답

```json
// POST /api/v1/saved-routes
{
  "name": "집→회사",
  "startName": "방배동",
  "endName": "광화문",
  "routeJson": { /* ODsay subPath 배열 + _start/_end 좌표 */ }
}

// GET 응답
[{ "id": 1, "name": "집→회사", "startName": "...", "endName": "...", "createdAt": "..." }]
```

### 제약

- 최대 10개: 저장 시 count 확인 → 초과 시 400 + "저장 경로는 최대 10개입니다"
- `routeJson`은 DB에 JSONB로 저장, GET 목록에서는 제외 (용량 절약)
- GET `/api/v1/saved-routes/{id}/detail` — routeJson 포함 단건 조회 (재탐색 시 사용)

### FE: SavedRoutesPanel

```jsx
// 저장된 경로 카드 클릭 → routeJson 로드 → onRouteRestore(routeJson) 호출
// App.jsx에서 routeJson → setSelectedPath() 또는 handleRouteSearch() 재실행
```

---

## 6. F-04: 버스 도착 알림 (Web Push)

### Web Push 흐름

```
1. FE: ServiceWorker 등록 → pushManager.subscribe(VAPID public key)
2. FE: POST /api/v1/push/subscribe { endpoint, p256dh, auth }
3. FE: POST /api/v1/push/alerts { stationId, routeId, minutesBefore }

4. BE: @Scheduled(fixedDelay=30000)
   → AlertSetting 목록 조회 (active=true)
   → 각 stationId → fetchArrivals()
   → traTime1 <= minutesBefore * 60 && traTime1 > 0 → push 발송
   → 발송 후 15분간 재발송 방지 (sentAt 추적)
```

### API

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/v1/push/subscribe | Web Push 구독 등록 |
| DELETE | /api/v1/push/subscribe | 구독 해제 |
| GET | /api/v1/push/alerts | 알림 설정 목록 |
| POST | /api/v1/push/alerts | 알림 설정 추가 |
| DELETE | /api/v1/push/alerts/{id} | 알림 설정 삭제 |
| PATCH | /api/v1/push/alerts/{id}/toggle | 알림 ON/OFF |

### 신규 파일 (BE)

```
domain/alert/
  PushSubscription.java
  AlertSetting.java
  AlertScheduler.java    — @Scheduled + Web Push 발송

external/webpush/
  WebPushAdapter.java    — nl.martijndwars:web-push 라이브러리 래핑
```

### 의존성 추가 (build.gradle)

```groovy
implementation 'nl.martijndwars:web-push:5.1.1'
implementation 'org.bouncycastle:bcprov-jdk18on:1.78'
```

### 환경변수

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@climate-bus.app
```

### ServiceWorker (FE)

```js
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge.png',
  });
});
```

---

## 7. F-05: 기후동행 이용 통계

### API

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/v1/stats/rides | 탑승 기록 추가 |
| GET | /api/v1/stats/monthly?year=&month= | 월별 통계 |
| DELETE | /api/v1/stats/rides/{id} | 기록 삭제 |

### 응답 (월별 통계)

```json
{
  "year": 2026,
  "month": 3,
  "rideCount": 12,
  "co2SavedKg": 3.84,    // 12 * 8km(평균) * 0.04 kg/km
  "moneySavedKrw": 14400 // 12 * 1200원(승용차 대비)
}
```

### 탄소 절감 계산 공식

```
버스 평균 이동 거리: 8km (고정값, 추후 조정 가능)
CO₂ 절감 = rideCount * 8km * 0.04 kg/km
절약 금액 = rideCount * 1200원 (택시/승용차 대비 평균)
```

### FE: StatsPanel

```jsx
// 탑승 기록 추가: 날짜 + 노선명 입력 (간단한 폼)
// 월별 탭: rideCount, CO₂, 절약 금액 카드 3개
// BottomTabBar에 'stats' 탭 추가 (차트 아이콘)
```

---

## 8. 패키지 구조 (BE 신규)

```
com.stw.climatebusmapbe
├── domain
│   ├── user
│   │   ├── User.java
│   │   ├── SocialProvider.java
│   │   ├── UserRepository.java
│   │   └── UserService.java
│   ├── favorite
│   │   ├── Favorite.java
│   │   ├── FavoriteRepository.java
│   │   └── FavoriteService.java
│   ├── savedroute
│   │   ├── SavedRoute.java
│   │   ├── SavedRouteRepository.java
│   │   └── SavedRouteService.java
│   ├── alert
│   │   ├── PushSubscription.java
│   │   ├── AlertSetting.java
│   │   ├── AlertRepository.java
│   │   ├── AlertService.java
│   │   └── AlertScheduler.java
│   └── stat
│       ├── RideLog.java
│       ├── RideLogRepository.java
│       └── StatService.java
├── external
│   ├── oauth
│   │   ├── KakaoOAuthAdapter.java
│   │   └── GoogleOAuthAdapter.java
│   └── webpush
│       └── WebPushAdapter.java
└── web
    ├── auth
    │   └── AuthController.java
    ├── favorite
    │   └── FavoriteController.java
    ├── savedroute
    │   └── SavedRouteController.java
    ├── push
    │   └── PushController.java
    └── stat
        └── StatController.java
```

---

## 9. FE 신규 파일/변경

```
src/
├── context/
│   └── AuthContext.jsx        — 로그인 상태, 사용자 정보 (GET /auth/me로 초기화)
├── components/
│   ├── LoginModal.jsx         — 이메일/비밀번호 입력 + 회원가입 탭
│   ├── SavedRoutesPanel.jsx   — 저장 경로 목록
│   ├── AlertSettingsModal.jsx — 알림 설정
│   └── StatsPanel.jsx         — 월별 통계
├── api/
│   ├── authApi.js             — signup/login/logout/me/refresh
│   ├── favoritesApi.js        — 서버/로컬 분기
│   ├── savedRoutesApi.js
│   ├── pushApi.js
│   └── statsApi.js
└── hooks/
    └── useAuth.js             — AuthContext 편의 훅
```

### BottomTabBar 탭 변경

```
현재: [nearby] [route] [favorites]
변경: [nearby] [route] [favorites] [stats]
```

---

## 10. 구현 순서

1. **DB 마이그레이션** — schema.sql에 테이블 추가 (users, favorites, ...)
2. **F-01 BE** — User 엔티티, KakaoOAuth, JwtProvider, SecurityConfig
3. **F-01 FE** — AuthContext, LoginModal
4. **F-02 BE** — Favorite CRUD API
5. **F-02 FE** — FavoritesPanel 서버/로컬 분기, 마이그레이션
6. **F-03 BE** — SavedRoute CRUD API
7. **F-03 FE** — SavedRoutesPanel
8. **F-05 BE+FE** — RideLog + StatsPanel (알림보다 단순)
9. **F-04 BE** — VAPID 설정, AlertScheduler
10. **F-04 FE** — ServiceWorker, PushApi, AlertSettingsModal

---

## 11. 주의사항

- **OAuth**: 현재 미구현, 추후 카카오/구글 추가 가능하도록 users 테이블에 `provider` 컬럼 nullable로 여지 남길 것
- **CORS**: 기존 `http://localhost:3000` → 프로덕션 도메인 추가 필요
- **Cookie SameSite**: `SameSite=Lax`면 일반 폼 로그인에 문제없음
- **비밀번호 검증**: 최소 8자, 영문+숫자 조합 정도 (복잡한 규칙 X)
- **이메일 인증**: 추후 추가 — 지금은 가입 즉시 사용 가능
- **iOS Web Push**: iOS 16.4+ Safari에서만 지원, 낮은 버전 안내 메시지 필요
- **AlertScheduler**: 서울 버스 API 한도 주의 — 알림 대상 정류소가 많아지면 캐시 적극 활용
