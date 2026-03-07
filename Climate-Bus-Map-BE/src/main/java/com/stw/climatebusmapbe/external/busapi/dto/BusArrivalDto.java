package com.stw.climatebusmapbe.external.busapi.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BusArrivalDto {
    private String routeId;
    private String routeNo;
    private int arrivalSec1;   // 1번째 버스 도착 예정 초
    private int arrivalSec2;   // 2번째 버스 도착 예정 초
}
