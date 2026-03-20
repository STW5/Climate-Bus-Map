package com.stw.climatebusmapbe.web.push.dto;

public record AlertSettingRequest(
        String stationId,
        String stationName,
        String routeId,
        String routeName,
        int minutesBefore
) {}
