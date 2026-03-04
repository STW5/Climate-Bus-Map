package com.stw.climatebusmapbe.external.busapi;

import com.stw.climatebusmapbe.external.busapi.dto.BusArrivalDto;
import com.stw.climatebusmapbe.external.busapi.dto.NearbyStationDto;

import java.util.List;

public interface BusApiPort {

    // Phase 1: API 연결 테스트
    String testConnection(String busRouteId);

    // Phase 2: 위치 기반 정류장 조회 (TM 좌표계)
    List<NearbyStationDto> getNearbyStations(double tmX, double tmY, int radius);

    // Phase 2: 정류장 도착 버스 정보 조회
    List<BusArrivalDto> getArrivals(String stationId);
}
