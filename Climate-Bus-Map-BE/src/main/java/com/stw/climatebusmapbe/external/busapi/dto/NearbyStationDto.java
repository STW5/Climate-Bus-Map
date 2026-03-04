package com.stw.climatebusmapbe.external.busapi.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class NearbyStationDto {
    private String stationId;
    private String stationName;
    private double x;  // TM 좌표 (Phase 2에서 WGS84로 변환)
    private double y;
}
