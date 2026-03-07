package com.stw.climatebusmapbe.external.busapi;

import com.stw.climatebusmapbe.external.busapi.dto.BusArrivalDto;
import com.stw.climatebusmapbe.external.busapi.dto.NearbyStationDto;

import java.util.List;

public interface BusApiPort {

    // 정류장 도착 버스 정보 조회 (getLowArrInfoByStIdList - 저상버스)
    // 등록된 API: getLowArrInfoByStIdList (stId 파라미터)
    List<BusArrivalDto> getArrivals(String stationId);
}
