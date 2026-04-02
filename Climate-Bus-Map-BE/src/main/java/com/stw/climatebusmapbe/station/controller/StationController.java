package com.stw.climatebusmapbe.station.controller;

import com.stw.climatebusmapbe.common.ApiResponse;
import com.stw.climatebusmapbe.station.dto.ClimateRoutesResponse;
import com.stw.climatebusmapbe.station.dto.NearbyStationsResponse;
import com.stw.climatebusmapbe.station.service.StationService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @GetMapping("/nearby")
    public ApiResponse<NearbyStationsResponse> getNearbyStations(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "500") @Min(1) @Max(3000) int radius
    ) {
        return ApiResponse.ok(stationService.getNearbyStations(lat, lng, radius));
    }

    @GetMapping("/nearby/climate-routes")
    public ApiResponse<ClimateRoutesResponse> getNearbyClimateRoutes(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "500") @Min(1) @Max(3000) int radius
    ) {
        return ApiResponse.ok(stationService.getNearbyClimateRoutes(lat, lng, radius));
    }
}
