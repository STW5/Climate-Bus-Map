package com.stw.climatebusmapbe.web.ride;

import com.stw.climatebusmapbe.common.ApiResponse;
import com.stw.climatebusmapbe.domain.ride.RideLog;
import com.stw.climatebusmapbe.domain.ride.RideLogService;
import com.stw.climatebusmapbe.domain.ride.RideLogService.RideStats;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rides")
@RequiredArgsConstructor
public class RideController {

    private final RideLogService rideLogService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> logRide(
            @AuthenticationPrincipal Long userId,
            @RequestBody Map<String, String> body) {
        if (userId == null) return ApiResponse.fail("UNAUTHORIZED");
        rideLogService.logRide(userId,
                body.get("routeId"),
                body.get("routeName"),
                body.get("stationId"));
        return ApiResponse.ok(null);
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getStats(@AuthenticationPrincipal Long userId) {
        if (userId == null) return ApiResponse.fail("UNAUTHORIZED");
        RideStats stats = rideLogService.getStats(userId);
        List<Map<String, String>> recent = stats.recent().stream()
                .map(r -> Map.of(
                        "routeName", r.getRouteName() != null ? r.getRouteName() : "",
                        "stationId", r.getStationId() != null ? r.getStationId() : "",
                        "rideDate", r.getRideDate().toString()
                ))
                .toList();
        return ApiResponse.ok(Map.of(
                "thisMonth", stats.thisMonth(),
                "lastMonth", stats.lastMonth(),
                "total", stats.total(),
                "recent", recent
        ));
    }
}
