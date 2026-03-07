package com.stw.climatebusmapbe.station.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class NearbyStationsResponse {
    private List<StationDto> stations;
}
