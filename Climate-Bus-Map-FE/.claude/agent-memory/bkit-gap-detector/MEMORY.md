# Gap Detector Memory - Climate Bus Map FE

## Project Structure
- **Tech Stack**: React 18 / Vite / T-Map Web SDK v2
- **Level**: Starter (components, hooks, api, utils, data)
- **Design Doc**: `Climate-Bus-Map-BE/docs/02-design/features/phase3.design.md`
- **Analysis Doc**: `Climate-Bus-Map-BE/docs/03-analysis/phase3.analysis.md`
- **FE Source**: `Climate-Bus-Map-FE/src/`

## Analysis History
| Version | Date | Match Rate | Key Changes |
|---------|------|:----------:|-------------|
| v1.0 | 2026-03-07 | 93% | Initial gap analysis |
| v1.1 | 2026-03-08 | 93% | Code analyzer refactoring noted |
| v1.2 | 2026-03-08 | 95% | useTmapReady, format.js, security fix |

## Known Intentional Deviations
- StationMarker.jsx not separate (integrated in MapView) - accepted at current scale
- ArrivalPanel slide animation not implemented - low priority
- ArrivalPanel prop name: `station` instead of `selectedStation` - shorthand

## Key Files (12 source files)
- `src/App.jsx` - Main state management
- `src/components/MapView.jsx` - T-Map integration
- `src/components/ArrivalPanel.jsx` - Arrival info panel
- `src/components/ClimateBadge.jsx` - Climate eligibility badge
- `src/api/busApi.js` - API calls (fetchArrivals, fetchNearbyStations)
- `src/hooks/useGeolocation.js` - GPS position with fallback
- `src/hooks/useTmapReady.js` - T-Map SDK dynamic loader
- `src/utils/format.js` - secToMin utility
- `src/data/mockStations.js` - Mock station data (5 stations)
