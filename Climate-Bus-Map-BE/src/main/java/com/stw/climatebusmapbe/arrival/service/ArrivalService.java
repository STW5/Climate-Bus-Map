package com.stw.climatebusmapbe.arrival.service;

import com.stw.climatebusmapbe.arrival.dto.ArrivalDto;
import com.stw.climatebusmapbe.arrival.dto.ArrivalResponse;
import com.stw.climatebusmapbe.external.busapi.BusApiPort;
import com.stw.climatebusmapbe.route.entity.ClimateEligibleRoute;
import com.stw.climatebusmapbe.route.repository.ClimateEligibleRouteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArrivalService {

    private final BusApiPort busApiPort;
    private final ClimateEligibleRouteRepository routeRepository;

    public ArrivalResponse getArrivals(String stationId) {
        log.info("도착 정보 조회: stationId={}", stationId);

        Set<String> eligibleRouteIds = routeRepository.findAll()
                .stream()
                .map(ClimateEligibleRoute::getRouteId)
                .collect(Collectors.toSet());

        List<ArrivalDto> arrivals = busApiPort.getArrivals(stationId)
                .stream()
                .map(dto -> new ArrivalDto(
                        dto.getRouteId(),
                        dto.getRouteNo(),
                        dto.getArrivalSec1(),
                        dto.getArrivalSec2(),
                        eligibleRouteIds.contains(dto.getRouteId())
                ))
                .toList();

        return new ArrivalResponse(stationId, arrivals);
    }
}
