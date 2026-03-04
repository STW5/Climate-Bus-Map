package com.stw.climatebusmapbe.external.busapi;

import com.stw.climatebusmapbe.external.busapi.dto.BusArrivalDto;
import com.stw.climatebusmapbe.external.busapi.dto.NearbyStationDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Slf4j
@Component
public class SeoulBusApiAdapter implements BusApiPort {

    private final RestClient restClient;
    private final String apiKey;

    public SeoulBusApiAdapter(
            RestClient.Builder builder,
            @Value("${seoul.bus.api.key}") String apiKey,
            @Value("${seoul.bus.api.base-url}") String baseUrl
    ) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    @Override
    public String testConnection(String busRouteId) {
        log.info("서울 버스 API 연결 테스트: busRouteId={}", busRouteId);
        return restClient.get()
                .uri("/busRouteInfo/getBusRouteInfo?serviceKey={key}&busRouteId={id}&resultType=json",
                        apiKey, busRouteId)
                .retrieve()
                .body(String.class);
    }

    @Override
    public List<NearbyStationDto> getNearbyStations(double tmX, double tmY, int radius) {
        // Phase 2에서 구현
        throw new UnsupportedOperationException("Phase 2에서 구현 예정");
    }

    @Override
    public List<BusArrivalDto> getArrivals(String stationId) {
        // Phase 2에서 구현
        throw new UnsupportedOperationException("Phase 2에서 구현 예정");
    }
}
