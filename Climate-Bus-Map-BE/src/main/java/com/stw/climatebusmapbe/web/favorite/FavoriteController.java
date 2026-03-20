package com.stw.climatebusmapbe.web.favorite;

import com.stw.climatebusmapbe.common.ApiResponse;
import com.stw.climatebusmapbe.domain.favorite.FavoriteService;
import com.stw.climatebusmapbe.web.favorite.dto.FavoriteRequest;
import com.stw.climatebusmapbe.web.favorite.dto.FavoriteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public ApiResponse<List<FavoriteResponse>> getAll(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(
                favoriteService.getAll(userId).stream().map(FavoriteResponse::from).toList()
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FavoriteResponse> add(@AuthenticationPrincipal Long userId,
                                             @RequestBody FavoriteRequest req) {
        return ApiResponse.ok(FavoriteResponse.from(favoriteService.add(userId, req)));
    }

    @DeleteMapping("/{stationId}")
    public ApiResponse<Void> remove(@AuthenticationPrincipal Long userId,
                                    @PathVariable String stationId) {
        favoriteService.remove(userId, stationId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/bulk")
    public ApiResponse<Void> bulk(@AuthenticationPrincipal Long userId,
                                  @RequestBody List<FavoriteRequest> items) {
        favoriteService.bulkAdd(userId, items);
        return ApiResponse.ok(null);
    }
}
