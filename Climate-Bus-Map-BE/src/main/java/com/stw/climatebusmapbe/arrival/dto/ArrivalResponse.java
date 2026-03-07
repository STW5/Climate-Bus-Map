package com.stw.climatebusmapbe.arrival.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ArrivalResponse {
    private String stationId;
    private List<ArrivalDto> arrivals;
}
