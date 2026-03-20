package com.stw.climatebusmapbe.web.push.dto;

import com.stw.climatebusmapbe.domain.alert.AlertSetting;

public record AlertSettingResponse(
        Long id,
        String stationId,
        String stationName,
        String routeId,
        String routeName,
        int minutesBefore,
        boolean active
) {
    public static AlertSettingResponse from(AlertSetting a) {
        return new AlertSettingResponse(
                a.getId(), a.getStationId(), a.getStationName(),
                a.getRouteId(), a.getRouteName(), a.getMinutesBefore(), a.isActive()
        );
    }
}
