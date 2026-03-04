package com.stw.climatebusmapbe.route.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class ClimateRouteResponse {

    private LocalDateTime updatedAt;
    private List<RouteDto> routes;

    @Getter
    @AllArgsConstructor
    public static class RouteDto {
        private String routeId;
        private String routeNo;
        private String routeType;
    }
}
