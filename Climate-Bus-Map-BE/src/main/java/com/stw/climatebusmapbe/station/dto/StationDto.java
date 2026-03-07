package com.stw.climatebusmapbe.station.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StationDto {
    private String stationId;
    private String stationName;
    private String arsId;
    private double lat;
    private double lng;
}
