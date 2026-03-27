package com.stw.climatebusmapbe.service;

import com.stw.climatebusmapbe.common.CoordinateConverter;
import com.stw.climatebusmapbe.external.busapi.BusApiPort;
import com.stw.climatebusmapbe.external.busapi.dto.NearbyStationDto;
import com.stw.climatebusmapbe.station.dto.NearbyStationsResponse;
import com.stw.climatebusmapbe.station.service.StationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StationServiceTest {

    @Mock
    private BusApiPort busApiPort;

    @Mock
    private CoordinateConverter coordinateConverter;

    @InjectMocks
    private StationService stationService;

    @BeforeEach
    void setUp() {
        lenient().when(coordinateConverter.toTM(anyDouble(), anyDouble())).thenReturn(new double[]{198010.0, 452340.0});
    }

    @Test
    @DisplayName("인근 정류장 목록을 반환한다")
    void getNearbyStations_returnsList() {
        when(busApiPort.getNearbyStations(anyDouble(), anyDouble(), anyInt()))
                .thenReturn(List.of(
                        new NearbyStationDto("111000018", "광화문앞", "02-138", 37.571, 126.976)
                ));

        NearbyStationsResponse response = stationService.getNearbyStations(37.571, 126.976, 500);

        assertThat(response.getStations()).hasSize(1);
        assertThat(response.getStations().get(0).getStationId()).isEqualTo("111000018");
        assertThat(response.getStations().get(0).getStationName()).isEqualTo("광화문앞");
    }

    @Test
    @DisplayName("서울 버스 API가 빈 목록을 반환하면 빈 응답을 반환한다")
    void getNearbyStations_emptyList() {
        when(busApiPort.getNearbyStations(anyDouble(), anyDouble(), anyInt()))
                .thenReturn(List.of());

        NearbyStationsResponse response = stationService.getNearbyStations(37.571, 126.976, 500);

        assertThat(response.getStations()).isEmpty();
    }
}
