package com.stw.climatebusmapbe.web.savedroute.dto;

import com.stw.climatebusmapbe.domain.savedroute.SavedRoute;

import java.time.LocalDateTime;

public record SavedRouteResponse(Long id, String name, String startName, String endName, LocalDateTime createdAt) {
    public static SavedRouteResponse from(SavedRoute r) {
        return new SavedRouteResponse(r.getId(), r.getName(), r.getStartName(), r.getEndName(), r.getCreatedAt());
    }
}
