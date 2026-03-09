package com.stw.climatebusmapbe.external.busapi;

import com.stw.climatebusmapbe.external.busapi.dto.BusArrivalDto;
import com.stw.climatebusmapbe.external.busapi.dto.NearbyStationDto;

import java.util.List;

public interface BusApiPort {

    // 정류장 도착 버스 정보 조회 (getLowArrInfoByStId - 저상버스)
    List<BusArrivalDto> getArrivals(String stationId);

    // 좌표 기반 근접 정류소 목록 조회 (getStationByPos)
    List<NearbyStationDto> getNearbyStations(double lng, double lat, int radius);
}
