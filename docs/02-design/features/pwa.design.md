# Design: PWA

## 패키지

```bash
npm install -D vite-plugin-pwa
```

## vite.config.js 변경

```js
import { VitePWA } from 'vite-plugin-pwa'

plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: { ... },
    workbox: { ... }
  })
]
```

## Web App Manifest

```json
{
  "name": "ClimateGo",
  "short_name": "ClimateGo",
  "description": "기후동행카드 버스 지도",
  "theme_color": "#1a73e8",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

## 아이콘

- SVG로 버스 아이콘 생성 → PNG 변환 불필요 (vite-plugin-pwa가 SVG 지원)
- 192x192, 512x512 두 가지

## Workbox 캐시 전략

| 리소스 | 전략 |
|--------|------|
| JS/CSS/HTML (앱 셸) | CacheFirst (precache) |
| 버스 API (`/api/v1/`) | NetworkFirst (오프라인 시 캐시 반환) |
| T-Map 타일 이미지 | CacheFirst, 최대 100개 |

## 파일 변경 목록

| 파일 | 변경 유형 |
|------|---------|
| `vite.config.js` | 수정 — VitePWA 플러그인 추가 |
| `public/icons/icon-192.png` | 신규 — 앱 아이콘 |
| `public/icons/icon-512.png` | 신규 — 앱 아이콘 |
| `index.html` | 수정 — theme-color 메타 태그 |
