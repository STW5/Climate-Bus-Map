package com.stw.climatebusmapbe.station.service;

import com.stw.climatebusmapbe.external.busapi.BusApiPort;
import com.stw.climatebusmapbe.external.busapi.dto.BusArrivalDto;
import com.stw.climatebusmapbe.external.busapi.dto.NearbyStationDto;
import com.stw.climatebusmapbe.station.dto.ClimateRoutesResponse;
import com.stw.climatebusmapbe.station.dto.NearbyStationsResponse;
import com.stw.climatebusmapbe.station.dto.StationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class StationService {

    private final BusApiPort busApiPort;

    @Cacheable(value = "nearbyStations", key = "#lat + '_' + #lng + '_' + #radius")
    public NearbyStationsResponse getNearbyStations(double lat, double lng, int radius) {
        log.info("주변 정류소 조회: lat={}, lng={}, radius={}", lat, lng, radius);

        List<StationDto> stations = busApiPort.getNearbyStations(lng, lat, radius)
                .stream()
                .map(dto -> new StationDto(dto.getStationId(), dto.getStationName(), dto.getArsId(), dto.getLat(), dto.getLng()))
                .toList();

        return new NearbyStationsResponse(stations);
    }

    @Cacheable(value = "nearbyClimateRoutes", key = "#lat + '_' + #lng + '_' + #radius")
    public ClimateRoutesResponse getNearbyClimateRoutes(double lat, double lng, int radius) {
        log.info("주변 기후동행 노선 집계: lat={}, lng={}, radius={}", lat, lng, radius);

        List<NearbyStationDto> stations = busApiPort.getNearbyStations(lng, lat, radius);

        // 정류소별 도착 버스 조회 → 기후동행 가능 노선 집계 (최대 10개 정류소)
        Set<String> seenRouteNos = new LinkedHashSet<>();
        List<ClimateRoutesResponse.RouteDto> climateRoutes = new ArrayList<>();
        Set<String> climateStationIds = new LinkedHashSet<>();

        // API 호출 최소화: 최대 8개 정류소만 체크 (일일 호출 한도 보호)
        int checkLimit = Math.min(stations.size(), 8);
        for (int i = 0; i < checkLimit; i++) {
            String stationId = stations.get(i).getStationId();
            try {
                List<BusArrivalDto> arrivals = busApiPort.getArrivals(stationId);
                for (BusArrivalDto arrival : arrivals) {
                    String routeNo = arrival.getRouteNo();
                    if (isClimateEligible(routeNo)) {
                        climateStationIds.add(stationId);
                        if (seenRouteNos.add(routeNo)) {
                            climateRoutes.add(new ClimateRoutesResponse.RouteDto(
                                    arrival.getRouteId(), routeNo, inferRouteType(routeNo)
                            ));
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("정류소 {} 도착정보 조회 실패: {}", stationId, e.getMessage());
            }
        }

        return new ClimateRoutesResponse(climateRoutes, stations.size(), new ArrayList<>(climateStationIds));
    }

    /**
     * 노선번호 패턴으로 기후동행카드 사용 가능 여부 판단
     * - 한글 포함 → 마을버스 ❌
     * - M/G/A 시작 → 광역·경기버스 ❌
     * - N + 숫자 → 심야버스 ✅
     * - 숫자만 → 간선·지선·순환버스 ✅
     */
    private boolean isClimateEligible(String routeNo) {
        if (routeNo == null || routeNo.isBlank()) return false;
        String no = routeNo.trim();
        if (no.matches(".*[가-힣].*")) return false;
        if (no.matches("(?i)^[MGA].*")) return false;
        if (no.matches("(?i)^N\\d+$")) return true;
        if (no.matches("^\\d+$")) return true;
        return false;
    }

    private String inferRouteType(String routeNo) {
        if (routeNo == null) return "기타";
        String no = routeNo.trim();
        if (no.matches("(?i)^N\\d+$")) return "심야";
        if (!no.matches("^\\d+$")) return "기타";
        int num = Integer.parseInt(no);
        if (num < 100) return "순환";
        return "간선";
    }
}
