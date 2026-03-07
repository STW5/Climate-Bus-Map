package com.stw.climatebusmapbe.station.service;

import com.stw.climatebusmapbe.common.exception.BusApiException;
import com.stw.climatebusmapbe.station.dto.NearbyStationsResponse;
import org.springframework.stereotype.Service;

@Service
public class StationService {

    public NearbyStationsResponse getNearbyStations(double lat, double lng, int radius) {
        // data.go.kr에서 '서울특별시 버스정류소정보조회 서비스'를 별도 신청해야 사용 가능합니다.
        // 현재 등록된 서비스: 버스도착정보조회 서비스 (arrive 4개 엔드포인트)
        throw new BusApiException("정류소 위치 조회 서비스가 미등록 상태입니다. data.go.kr에서 '서울특별시 버스정류소정보조회 서비스'를 별도 신청하세요.");
    }
}
