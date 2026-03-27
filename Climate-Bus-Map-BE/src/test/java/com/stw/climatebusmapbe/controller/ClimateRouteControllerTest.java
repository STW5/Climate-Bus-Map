package com.stw.climatebusmapbe.controller;

import com.stw.climatebusmapbe.common.security.JwtProvider;
import com.stw.climatebusmapbe.route.controller.ClimateRouteController;
import com.stw.climatebusmapbe.route.dto.ClimateRouteResponse;
import com.stw.climatebusmapbe.route.service.ClimateRouteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ClimateRouteController.class)
class ClimateRouteControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ClimateRouteService climateRouteService;

    @MockitoBean
    JwtProvider jwtProvider;

    @Test
    void getClimateRoutes_성공_응답구조확인() throws Exception {
        List<ClimateRouteResponse.RouteDto> routes = List.of(
                new ClimateRouteResponse.RouteDto("100100118", "402", "간선"),
                new ClimateRouteResponse.RouteDto("100100234", "721", "지선")
        );
        given(climateRouteService.getAllRoutes())
                .willReturn(new ClimateRouteResponse(LocalDateTime.of(2026, 3, 1, 0, 0), routes));

        mockMvc.perform(get("/api/v1/climate-routes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.error").isEmpty())
                .andExpect(jsonPath("$.data.routes.length()").value(2))
                .andExpect(jsonPath("$.data.routes[0].routeId").value("100100118"))
                .andExpect(jsonPath("$.data.routes[0].routeNo").value("402"))
                .andExpect(jsonPath("$.data.routes[0].routeType").value("간선"));
    }

    @Test
    void getClimateRoutes_빈목록_성공응답() throws Exception {
        given(climateRouteService.getAllRoutes())
                .willReturn(new ClimateRouteResponse(LocalDateTime.now(), List.of()));

        mockMvc.perform(get("/api/v1/climate-routes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.routes.length()").value(0));
    }
}
