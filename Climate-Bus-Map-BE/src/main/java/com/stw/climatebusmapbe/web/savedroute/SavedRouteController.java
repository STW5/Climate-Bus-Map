package com.stw.climatebusmapbe.web.savedroute;

import com.stw.climatebusmapbe.common.ApiResponse;
import com.stw.climatebusmapbe.domain.savedroute.SavedRouteService;
import com.stw.climatebusmapbe.web.savedroute.dto.SaveRouteRequest;
import com.stw.climatebusmapbe.web.savedroute.dto.SavedRouteDetailResponse;
import com.stw.climatebusmapbe.web.savedroute.dto.SavedRouteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/saved-routes")
@RequiredArgsConstructor
public class SavedRouteController {

    private final SavedRouteService savedRouteService;

    @GetMapping
    public ApiResponse<List<SavedRouteResponse>> getAll(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(
                savedRouteService.getAll(userId).stream().map(SavedRouteResponse::from).toList()
        );
    }

    @GetMapping("/{id}/detail")
    public ApiResponse<SavedRouteDetailResponse> getDetail(@AuthenticationPrincipal Long userId,
                                                            @PathVariable Long id) {
        return ApiResponse.ok(SavedRouteDetailResponse.from(savedRouteService.getDetail(userId, id)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SavedRouteResponse> save(@AuthenticationPrincipal Long userId,
                                                @RequestBody SaveRouteRequest req) {
        return ApiResponse.ok(SavedRouteResponse.from(savedRouteService.save(userId, req)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        savedRouteService.delete(userId, id);
        return ApiResponse.ok(null);
    }
}
