package com.stw.climatebusmapbe.web.savedroute.dto;

import com.stw.climatebusmapbe.domain.savedroute.SavedRoute;

import java.time.LocalDateTime;

public record SavedRouteDetailResponse(Long id, String name, String startName, String endName,
                                        String routeJson, LocalDateTime createdAt) {
    public static SavedRouteDetailResponse from(SavedRoute r) {
        return new SavedRouteDetailResponse(
                r.getId(), r.getName(), r.getStartName(), r.getEndName(),
                r.getRouteJson(), r.getCreatedAt()
        );
    }
}
