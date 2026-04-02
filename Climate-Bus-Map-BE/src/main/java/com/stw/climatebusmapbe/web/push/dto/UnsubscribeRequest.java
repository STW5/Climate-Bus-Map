package com.stw.climatebusmapbe.web.push.dto;

import jakarta.validation.constraints.NotBlank;

public record UnsubscribeRequest(
        @NotBlank String endpoint
) {}
