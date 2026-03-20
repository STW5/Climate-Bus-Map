package com.stw.climatebusmapbe.web.favorite.dto;

public record FavoriteRequest(String stationId, String stationName, String arsId, double lat, double lng) {}
