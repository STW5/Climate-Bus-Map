package com.stw.climatebusmapbe.station.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ClimateRoutesResponse {
    private List<RouteDto> routes;
    private int stationCount;
    private List<String> climateStationIds;

    @Getter
    @AllArgsConstructor
    public static class RouteDto {
        private String routeId;
        private String routeNo;
        private String routeType;
    }
}
