package com.stw.climatebusmapbe.station.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
public class ClimateRoutesResponse {
    private final List<RouteDto> routes;
    private final int stationCount;
    private final List<String> climateStationIds;
    private final boolean apiLimitExceeded;

    public ClimateRoutesResponse(List<RouteDto> routes, int stationCount, List<String> climateStationIds) {
        this(routes, stationCount, climateStationIds, false);
    }

    public ClimateRoutesResponse(List<RouteDto> routes, int stationCount, List<String> climateStationIds, boolean apiLimitExceeded) {
        this.routes = routes;
        this.stationCount = stationCount;
        this.climateStationIds = climateStationIds;
        this.apiLimitExceeded = apiLimitExceeded;
    }

    @Getter
    @AllArgsConstructor
    public static class RouteDto {
        private String routeId;
        private String routeNo;
        private String routeType;
    }
}
