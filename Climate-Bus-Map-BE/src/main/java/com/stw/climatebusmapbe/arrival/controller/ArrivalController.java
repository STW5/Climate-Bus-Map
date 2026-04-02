package com.stw.climatebusmapbe.arrival.controller;

import com.stw.climatebusmapbe.arrival.dto.ArrivalResponse;
import com.stw.climatebusmapbe.arrival.service.ArrivalService;
import com.stw.climatebusmapbe.common.ApiResponse;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/stations")
@RequiredArgsConstructor
public class ArrivalController {

    private final ArrivalService arrivalService;

    @GetMapping("/{stationId}/arrivals")
    public ApiResponse<ArrivalResponse> getArrivals(
            @PathVariable @Pattern(regexp = "^\\d{1,20}$", message = "정류소 ID가 올바르지 않습니다") String stationId) {
        return ApiResponse.ok(arrivalService.getArrivals(stationId));
    }
}
