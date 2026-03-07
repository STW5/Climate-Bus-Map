package com.stw.climatebusmapbe.service;

import com.stw.climatebusmapbe.arrival.dto.ArrivalResponse;
import com.stw.climatebusmapbe.arrival.service.ArrivalService;
import com.stw.climatebusmapbe.external.busapi.BusApiPort;
import com.stw.climatebusmapbe.external.busapi.dto.BusArrivalDto;
import com.stw.climatebusmapbe.route.entity.ClimateEligibleRoute;
import com.stw.climatebusmapbe.route.repository.ClimateEligibleRouteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ArrivalServiceTest {

    @Mock
    private BusApiPort busApiPort;

    @Mock
    private ClimateEligibleRouteRepository routeRepository;

    @InjectMocks
    private ArrivalService arrivalService;

    @Test
    @DisplayName("기후동행 가능 노선은 climateEligible=true, 불가 노선은 false를 반환한다")
    void getArrivals_marksClimateEligibleCorrectly() {
        ClimateEligibleRoute eligibleRoute = mock(ClimateEligibleRoute.class);
        when(eligibleRoute.getRouteId()).thenReturn("100100118");
        when(routeRepository.findAll()).thenReturn(List.of(eligibleRoute));

        when(busApiPort.getArrivals("111000018")).thenReturn(List.of(
                new BusArrivalDto("100100118", "402", 150, 660),
                new BusArrivalDto("100200045", "103", 90, 420)
        ));

        ArrivalResponse response = arrivalService.getArrivals("111000018");

        assertThat(response.getStationId()).isEqualTo("111000018");
        assertThat(response.getArrivals()).hasSize(2);
        assertThat(response.getArrivals().get(0).isClimateEligible()).isTrue();
        assertThat(response.getArrivals().get(1).isClimateEligible()).isFalse();
    }

    @Test
    @DisplayName("도착 버스가 없으면 빈 배열을 반환한다")
    void getArrivals_emptyList() {
        when(routeRepository.findAll()).thenReturn(List.of());
        when(busApiPort.getArrivals("999")).thenReturn(List.of());

        ArrivalResponse response = arrivalService.getArrivals("999");

        assertThat(response.getArrivals()).isEmpty();
    }
}
