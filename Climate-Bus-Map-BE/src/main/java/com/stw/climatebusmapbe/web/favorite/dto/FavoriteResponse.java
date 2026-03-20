package com.stw.climatebusmapbe.web.favorite.dto;

import com.stw.climatebusmapbe.domain.favorite.Favorite;

public record FavoriteResponse(String stationId, String stationName, String arsId, double lat, double lng) {
    public static FavoriteResponse from(Favorite f) {
        return new FavoriteResponse(f.getStationId(), f.getStationName(), f.getArsId(), f.getLat(), f.getLng());
    }
}
