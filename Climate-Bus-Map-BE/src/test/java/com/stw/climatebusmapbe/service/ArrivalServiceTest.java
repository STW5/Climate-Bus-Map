package com.stw.climatebusmapbe.service;

import com.stw.climatebusmapbe.arrival.dto.ArrivalResponse;
import com.stw.climatebusmapbe.arrival.service.ArrivalService;
import com.stw.climatebusmapbe.external.busapi.BusApiPort;
import com.stw.climatebusmapbe.external.busapi.dto.BusArrivalDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ArrivalServiceTest {

    @Mock
    private BusApiPort busApiPort;

    @InjectMocks
    private ArrivalService arrivalService;

    @Test
    @DisplayName("기후동행 가능 노선(간선)은 true, 불가 노선(광역)은 false를 반환한다")
    void getArrivals_marksClimateEligibleCorrectly() {
        when(busApiPort.getArrivals("111000018")).thenReturn(List.of(
                new BusArrivalDto("100100118", "402", 150, 660),   // 간선 → 가능
                new BusArrivalDto("100200045", "M6427", 90, 420)   // 광역 → 불가
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
        when(busApiPort.getArrivals("999")).thenReturn(List.of());

        ArrivalResponse response = arrivalService.getArrivals("999");

        assertThat(response.getArrivals()).isEmpty();
    }

    @ParameterizedTest(name = "{0} → 기후동행 {1}")
    @DisplayName("노선번호 패턴별 기후동행 가능 여부 판정")
    @CsvSource({
            "402,   true",   // 간선
            "721,   true",   // 지선
            "N37,   true",   // 심야
            "M6427, false",  // 광역
            "G6000, false",  // 경기
            "A1,    false",  // 공항
    })
    void isClimateEligible_routeNoPattern(String routeNo, boolean expected) {
        assertThat(ArrivalService.isClimateEligible(routeNo)).isEqualTo(expected);
    }
}
