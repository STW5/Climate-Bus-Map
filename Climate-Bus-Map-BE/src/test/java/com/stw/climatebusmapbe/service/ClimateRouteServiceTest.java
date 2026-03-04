package com.stw.climatebusmapbe.service;

import com.stw.climatebusmapbe.route.dto.ClimateRouteResponse;
import com.stw.climatebusmapbe.route.entity.ClimateEligibleRoute;
import com.stw.climatebusmapbe.route.repository.ClimateEligibleRouteRepository;
import com.stw.climatebusmapbe.route.service.ClimateRouteService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class ClimateRouteServiceTest {

    @Mock
    ClimateEligibleRouteRepository repository;

    @InjectMocks
    ClimateRouteService service;

    @Test
    void getAllRoutes_노선목록과_최신updatedAt_반환() {
        LocalDateTime older = LocalDateTime.of(2026, 2, 1, 0, 0);
        LocalDateTime newer = LocalDateTime.of(2026, 3, 1, 0, 0);

        ClimateEligibleRoute route1 = mockRoute("100100118", "402", "간선", older);
        ClimateEligibleRoute route2 = mockRoute("100100234", "721", "지선", newer);
        given(repository.findAll()).willReturn(List.of(route1, route2));

        ClimateRouteResponse result = service.getAllRoutes();

        assertThat(result.getUpdatedAt()).isEqualTo(newer);
        assertThat(result.getRoutes()).hasSize(2);
        assertThat(result.getRoutes().get(0).getRouteNo()).isEqualTo("402");
        assertThat(result.getRoutes().get(1).getRouteType()).isEqualTo("지선");
    }

    @Test
    void getAllRoutes_빈목록이면_updatedAt은_현재시간근방() {
        given(repository.findAll()).willReturn(List.of());

        ClimateRouteResponse result = service.getAllRoutes();

        assertThat(result.getRoutes()).isEmpty();
        assertThat(result.getUpdatedAt()).isNotNull();
    }

    private ClimateEligibleRoute mockRoute(String routeId, String routeNo, String routeType, LocalDateTime updatedAt) {
        ClimateEligibleRoute route = mock(ClimateEligibleRoute.class);
        given(route.getRouteId()).willReturn(routeId);
        given(route.getRouteNo()).willReturn(routeNo);
        given(route.getRouteType()).willReturn(routeType);
        given(route.getUpdatedAt()).willReturn(updatedAt);
        return route;
    }
}
