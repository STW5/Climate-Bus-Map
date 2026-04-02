package com.stw.climatebusmapbe.web.ride.dto;

import jakarta.validation.constraints.NotBlank;

public record LogRideRequest(
        @NotBlank String routeId,
        @NotBlank String routeName,
        @NotBlank String stationId
) {}
