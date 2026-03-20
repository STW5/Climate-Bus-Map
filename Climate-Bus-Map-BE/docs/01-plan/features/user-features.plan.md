# Plan: 사용자 기능 — 로그인 · 즐겨찾기 동기화 · 경로 저장 · 알림 · 통계

> 비로그인 앱에 계정 기반 개인화 기능을 추가하여 재방문율과 앱 가치를 높인다

- **작성일**: 2026-03-20
- **레벨**: Dynamic
- **상태**: 계획 중

---

## 1. 배경 및 동기

현재 앱은 100% 비로그인 서비스다.
- 즐겨찾기는 localStorage에만 저장 → 기기 바꾸면 사라짐
- 경로 탐색 결과 저장 불가
- 버스 도착 알림 (push) 불가 — 서버 측 스케줄러 없음
- 사용자별 기후동행 이용 통계 없음

네이버지도·카카오맵은 로그인 후 장소 저장, 최근 경로, 도착 알림을 제공한다.
기후동행 앱의 차별점은 **기후동행 특화 통계** — 내가 기후동행 버스를 몇 번 탔는지, 탄소를 얼마나 줄였는지 보여주는 것.

---

## 2. 기능 목록 (우선순위 순)

### F-01: 소셜 로그인 (카카오 / 구글)
- 회원가입 없이 OAuth 소셜 로그인
- JWT (Access 1h + Refresh 7d)
- 비로그인 사용자도 앱 기본 기능 전부 사용 가능 (로그인은 선택)

### F-02: 즐겨찾기 서버 동기화
- 현재 localStorage → 서버 DB로 마이그레이션
- 비로그인: 기존과 동일하게 localStorage 유지
- 로그인: 즐겨찾기 추가/삭제 시 서버 반영, 기기 간 동기화
- 첫 로그인 시 localStorage 즐겨찾기 → 서버 자동 이전

### F-03: 자주 가는 경로 저장
- 경로 탐색 결과를 이름 붙여 저장 (e.g. "집→회사")
- 저장된 경로 탭에서 원클릭 재탐색
- 최대 10개 저장

### F-04: 버스 도착 알림 (Push Notification)
- 즐겨찾기 정류장의 특정 노선 도착 N분 전 알림 설정
- Web Push (PWA ServiceWorker + VAPID)
- 서버에서 30초 주기 도착 정보 폴링 → 조건 충족 시 push 발송
- 알림은 최대 3개 동시 설정

### F-05: 기후동행 이용 통계
- 로그인 사용자가 "기후동행 버스 탑승 기록" 수동 등록
- 월별 탑승 횟수, 절감 탄소량(kg CO₂), 절약 금액(원) 계산
- 간단한 대시보드 UI (SelectedRoutePanel 하단 또는 별도 탭)

---

## 3. 구현 범위

### Backend (Spring Boot)

**F-01 로그인**
- `User` 엔티티 + `SocialProvider` enum (KAKAO, GOOGLE)
- OAuth2 인가 코드 흐름 처리 (`/api/v1/auth/kakao`, `/api/v1/auth/google`)
- JWT 발급 / 재발급 / 로그아웃 API
- Spring Security 설정 (비로그인 접근 허용 범위 정의)

**F-02 즐겨찾기 동기화**
- `Favorite` 엔티티 (userId, stationId, stationName, arsId, lat, lng)
- GET/POST/DELETE `/api/v1/favorites`
- 초기 마이그레이션 엔드포인트 `POST /api/v1/favorites/bulk`

**F-03 경로 저장**
- `SavedRoute` 엔티티 (userId, name, startName, endName, routeJson JSONB)
- CRUD `/api/v1/saved-routes`

**F-04 알림**
- `PushSubscription` 엔티티 (userId, endpoint, keys)
- `AlertSetting` 엔티티 (userId, stationId, routeId, minutesBefore)
- Web Push 발송 라이브러리 (nl.martijndwars:web-push 또는 java-webpush)
- 스케줄러: @Scheduled(fixedDelay=30000) → 알림 대상 조회 → push 발송

**F-05 통계**
- `RideLog` 엔티티 (userId, date, routeId, routeName, stationId)
- GET `/api/v1/stats/monthly?year=&month=`
- 탄소 절감 계산: 버스 1km당 0.04kg CO₂ 절감 (승용차 대비 평균)

### Frontend (React)

- `AuthContext`: 로그인 상태, 토큰, 사용자 정보 관리
- `LoginModal`: 카카오/구글 OAuth 버튼
- `FavoritesPanel` 수정: 로그인 여부에 따라 서버/localStorage 분기
- `SavedRoutesPanel`: 저장된 경로 목록 + 원클릭 재탐색
- `AlertSettingsModal`: 정류장/노선/알림 시간 선택
- `StatsPanel`: 월별 탑승 통계 대시보드
- ServiceWorker: Web Push 수신 처리

---

## 4. DB 스키마 (요약)

```sql
users         (id, provider, provider_id, email, nickname, created_at)
favorites     (id, user_id, station_id, station_name, ars_id, lat, lng, created_at)
saved_routes  (id, user_id, name, start_name, end_name, route_json, created_at)
push_subs     (id, user_id, endpoint, p256dh, auth, created_at)
alert_settings(id, user_id, station_id, route_id, minutes_before, active)
ride_logs     (id, user_id, date, route_id, route_name, station_id)
```

---

## 5. 구현 순서 (추천)

1. **F-01 로그인** — 나머지 모든 기능의 전제 조건
2. **F-02 즐겨찾기 동기화** — 가장 즉각적인 사용자 가치, localStorage 코드 재활용 가능
3. **F-03 경로 저장** — 구조가 단순, F-02 완료 후 빠르게 추가 가능
4. **F-05 통계** — 수동 기록이므로 push 인프라 불필요, F-01만 있으면 구현 가능
5. **F-04 알림** — Web Push 인프라 필요, 가장 복잡, 마지막에

---

## 6. 범위 외 (미래 고려)

- Apple Sign In (App Store 배포 시 필요)
- 친구 간 경로 공유
- 기후동행 카드 자동 연동 (공공 API 없음)
- 관리자 대시보드

---

## 7. 리스크

| 항목 | 리스크 | 대응 |
|------|--------|------|
| 카카오 OAuth | 앱 등록 + 리디렉션 URI 설정 필요 | 개발 환경 먼저 등록 |
| Web Push | iOS Safari 지원 제한적 (iOS 16.4+ 필요) | 지원 안내 메시지 표시 |
| VAPID 키 관리 | 키 분실 시 기존 구독 전부 무효화 | 환경변수로 안전 보관 |
| Spring Security 추가 | 기존 비인증 API에 영향 가능 | permitAll() 범위 신중히 설정 |
| JWT 토큰 저장 | localStorage XSS 취약 | HttpOnly Cookie 사용 권장 |
