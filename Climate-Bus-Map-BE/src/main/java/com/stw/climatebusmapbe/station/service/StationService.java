package com.stw.climatebusmapbe.station.service;

import com.stw.climatebusmapbe.external.busapi.BusApiPort;
import com.stw.climatebusmapbe.external.busapi.dto.BusArrivalDto;
import com.stw.climatebusmapbe.external.busapi.dto.NearbyStationDto;
import com.stw.climatebusmapbe.route.entity.ClimateEligibleRoute;
import com.stw.climatebusmapbe.route.repository.ClimateEligibleRouteRepository;
import com.stw.climatebusmapbe.station.dto.ClimateRoutesResponse;
import com.stw.climatebusmapbe.station.dto.NearbyStationsResponse;
import com.stw.climatebusmapbe.station.dto.StationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StationService {

    private final BusApiPort busApiPort;
    private final ClimateEligibleRouteRepository routeRepository;

    @Cacheable(value = "nearbyStations", key = "#lat + '_' + #lng + '_' + #radius")
    public NearbyStationsResponse getNearbyStations(double lat, double lng, int radius) {
        log.info("주변 정류소 조회: lat={}, lng={}, radius={}", lat, lng, radius);

        List<StationDto> stations = busApiPort.getNearbyStations(lng, lat, radius)
                .stream()
                .map(dto -> new StationDto(dto.getStationId(), dto.getStationName(), dto.getArsId(), dto.getLat(), dto.getLng()))
                .toList();

        return new NearbyStationsResponse(stations);
    }

    public ClimateRoutesResponse getNearbyClimateRoutes(double lat, double lng, int radius) {
        log.info("주변 기후동행 노선 집계: lat={}, lng={}, radius={}", lat, lng, radius);

        List<NearbyStationDto> stations = busApiPort.getNearbyStations(lng, lat, radius);

        Map<String, ClimateEligibleRoute> eligibleRoutes = routeRepository.findAll()
                .stream()
                .collect(Collectors.toMap(ClimateEligibleRoute::getRouteId, r -> r));

        // 정류소별 도착 버스 조회 → 기후동행 가능 노선 집계 (최대 10개 정류소)
        Set<String> seenRouteIds = new LinkedHashSet<>();
        List<ClimateRoutesResponse.RouteDto> climateRoutes = new ArrayList<>();
        Set<String> climateStationIds = new LinkedHashSet<>();

        int limit = Math.min(stations.size(), 10);
        for (int i = 0; i < limit; i++) {
            String stationId = stations.get(i).getStationId();
            try {
                List<BusArrivalDto> arrivals = busApiPort.getArrivals(stationId);
                for (BusArrivalDto arrival : arrivals) {
                    String routeId = arrival.getRouteId();
                    if (eligibleRoutes.containsKey(routeId)) {
                        climateStationIds.add(stationId);
                        if (seenRouteIds.add(routeId)) {
                            ClimateEligibleRoute route = eligibleRoutes.get(routeId);
                            climateRoutes.add(new ClimateRoutesResponse.RouteDto(
                                    routeId, arrival.getRouteNo(), route.getRouteType()
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
}
