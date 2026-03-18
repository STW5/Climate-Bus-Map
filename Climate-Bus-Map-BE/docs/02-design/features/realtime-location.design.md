# Design: realtime-location

**작성일:** 2026-03-18

---

## 1. useGeolocation 훅 변경

### 변경 전
```js
navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 5000 });
```

### 변경 후
```js
const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
});
// cleanup
return () => navigator.geolocation.clearWatch(watchId);
```

- `enableHighAccuracy: true` — GPS 칩 사용 (배터리 소모 증가, 정확도 향상)
- `maximumAge: 0` — 캐시 위치 사용 안 함
- `setStable` 로직 유지 — 동일 좌표 중복 렌더 방지
- `isFallback` 반환값 유지

---

## 2. MapView 내 위치 마커

### 마커 아이콘 (SVG 파란 점)
```js
const makeMyLocationIcon = () => {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">',
    '<circle cx="12" cy="12" r="8" fill="#1a73e8" opacity="0.25"/>',  // 정확도 원
    '<circle cx="12" cy="12" r="5" fill="#1a73e8"/>',                  // 중심 점
    '<circle cx="12" cy="12" r="5" fill="none" stroke="white" stroke-width="2"/>',
    '</svg>',
  ].join('');
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
};
```

### 마커 생성 및 업데이트
```js
// 최초 생성
myLocationMarkerRef.current = new Tmapv2.Marker({
  position: new Tmapv2.LatLng(center.lat, center.lng),
  map: mapRef.current,
  icon: makeMyLocationIcon(),
  iconSize: new Tmapv2.Size(24, 24),
  zIndex: 1000,
});

// center(위치) 바뀔 때마다
myLocationMarkerRef.current.setPosition(
  new Tmapv2.LatLng(center.lat, center.lng)
);
```

---

## 3. useEffect 구조 (MapView)

| useEffect | deps | 역할 |
|---|---|---|
| 지도 초기화 | `[tmapReady, center]` | 지도 생성 + 내 위치 마커 최초 생성 |
| 내 위치 업데이트 | `[center]` | center 바뀔 때 마커 위치만 이동 |
| 정류장 마커 | `[tmapReady, stations, onStationSelect]` | 기존 유지 |
| 경로 폴리라인 | `[tmapReady, routePath]` | 기존 유지 |

---

## 4. 주의사항

- 지도 초기화 useEffect가 `center` dep을 가지고 있어 위치가 바뀔 때마다 지도 재생성되는 문제 → **별도 useEffect로 마커만 업데이트**
- cleanup 시 마커도 `setMap(null)` 처리
