package com.stw.climatebusmapbe.arrival.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ArrivalDto {
    private String routeId;
    private String routeNo;
    private int arrivalSec1;
    private int arrivalSec2;
    private boolean climateEligible;
}
