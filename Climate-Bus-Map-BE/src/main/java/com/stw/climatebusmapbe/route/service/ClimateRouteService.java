package com.stw.climatebusmapbe.route.service;

import com.stw.climatebusmapbe.route.dto.ClimateRouteResponse;
import com.stw.climatebusmapbe.route.entity.ClimateEligibleRoute;
import com.stw.climatebusmapbe.route.repository.ClimateEligibleRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClimateRouteService {

    private final ClimateEligibleRouteRepository climateEligibleRouteRepository;

    public ClimateRouteResponse getAllRoutes() {
        List<ClimateEligibleRoute> routes = climateEligibleRouteRepository.findAll();

        LocalDateTime latestUpdatedAt = routes.stream()
                .map(ClimateEligibleRoute::getUpdatedAt)
                .max(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());

        List<ClimateRouteResponse.RouteDto> routeDtos = routes.stream()
                .map(r -> new ClimateRouteResponse.RouteDto(r.getRouteId(), r.getRouteNo(), r.getRouteType()))
                .toList();

        return new ClimateRouteResponse(latestUpdatedAt, routeDtos);
    }
}
