package com.stw.climatebusmapbe.web.push;

import com.stw.climatebusmapbe.common.ApiResponse;
import com.stw.climatebusmapbe.domain.alert.AlertService;
import com.stw.climatebusmapbe.web.push.dto.AlertSettingRequest;
import com.stw.climatebusmapbe.web.push.dto.AlertSettingResponse;
import com.stw.climatebusmapbe.web.push.dto.PushSubscribeRequest;
import com.stw.climatebusmapbe.web.push.dto.UnsubscribeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/push")
@RequiredArgsConstructor
public class PushController {

    private final AlertService alertService;

    @Value("${vapid.public-key}")
    private String vapidPublicKey;

    @GetMapping("/vapid-public-key")
    public ApiResponse<Map<String, String>> getVapidPublicKey() {
        return ApiResponse.ok(Map.of("publicKey", vapidPublicKey));
    }

    @PostMapping("/subscribe")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> subscribe(@AuthenticationPrincipal Long userId,
                                       @RequestBody PushSubscribeRequest req) {
        alertService.subscribe(userId, req);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/subscribe")
    public ApiResponse<Void> unsubscribe(@AuthenticationPrincipal Long userId,
                                         @Valid @RequestBody UnsubscribeRequest body) {
        alertService.unsubscribe(userId, body.endpoint());
        return ApiResponse.ok(null);
    }

    @GetMapping("/alerts")
    public ApiResponse<List<AlertSettingResponse>> getAlerts(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(
                alertService.getAlerts(userId).stream().map(AlertSettingResponse::from).toList()
        );
    }

    @PostMapping("/alerts")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AlertSettingResponse> addAlert(@AuthenticationPrincipal Long userId,
                                                      @RequestBody AlertSettingRequest req) {
        return ApiResponse.ok(AlertSettingResponse.from(alertService.addAlert(userId, req)));
    }

    @DeleteMapping("/alerts/{id}")
    public ApiResponse<Void> deleteAlert(@AuthenticationPrincipal Long userId,
                                         @PathVariable Long id) {
        alertService.deleteAlert(userId, id);
        return ApiResponse.ok(null);
    }

    @PatchMapping("/alerts/{id}/toggle")
    public ApiResponse<Void> toggleAlert(@AuthenticationPrincipal Long userId,
                                          @PathVariable Long id) {
        alertService.toggleAlert(userId, id);
        return ApiResponse.ok(null);
    }
}
