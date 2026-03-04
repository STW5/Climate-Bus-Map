package com.stw.climatebusmapbe.route.controller;

import com.stw.climatebusmapbe.common.ApiResponse;
import com.stw.climatebusmapbe.route.dto.ClimateRouteResponse;
import com.stw.climatebusmapbe.route.service.ClimateRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ClimateRouteController {

    private final ClimateRouteService climateRouteService;

    @GetMapping("/climate-routes")
    public ApiResponse<ClimateRouteResponse> getClimateRoutes() {
        return ApiResponse.ok(climateRouteService.getAllRoutes());
    }
}
