package com.stw.climatebusmapbe.arrival.service;

import com.stw.climatebusmapbe.arrival.dto.ArrivalDto;
import com.stw.climatebusmapbe.arrival.dto.ArrivalResponse;
import com.stw.climatebusmapbe.external.busapi.BusApiPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArrivalService {

    private final BusApiPort busApiPort;

    public ArrivalResponse getArrivals(String stationId) {
        log.info("도착 정보 조회: stationId={}", stationId);

        List<ArrivalDto> arrivals = busApiPort.getArrivals(stationId)
                .stream()
                .map(dto -> new ArrivalDto(
                        dto.getRouteId(),
                        dto.getRouteNo(),
                        dto.getArrivalSec1(),
                        dto.getArrivalSec2(),
                        isClimateEligible(dto.getRouteNo())
                ))
                .toList();

        return new ArrivalResponse(stationId, arrivals);
    }

    /**
     * 노선번호 패턴으로 기후동행카드 사용 가능 여부 판단
     * - 한글 포함 → 마을버스 (❌)
     * - M/G/A 시작 → 광역·경기버스 (❌)
     * - N 시작 → 심야버스 (✅)
     * - 숫자만 → 간선·지선·순환버스 (✅)
     */
    public static boolean isClimateEligible(String routeNo) {
        if (routeNo == null || routeNo.isBlank()) return false;
        String no = routeNo.trim();
        if (no.matches(".*[가-힣].*")) return false;           // 마을버스
        if (no.matches("(?i)^[MGA].*")) return false;          // 광역·경기버스
        if (no.matches("(?i)^N\\d+$")) return true;            // 심야버스
        if (no.matches("^\\d+$")) return true;                 // 간선·지선·순환
        return false;
    }
}
