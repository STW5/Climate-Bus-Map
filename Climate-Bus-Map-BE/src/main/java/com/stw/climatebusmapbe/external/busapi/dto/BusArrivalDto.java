package com.stw.climatebusmapbe.external.busapi.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BusArrivalDto {
    private String routeId;
    private String routeNo;
    private int arivalSec1;   // 1번째 버스 도착 예정 초
    private int arivalSec2;   // 2번째 버스 도착 예정 초
}
