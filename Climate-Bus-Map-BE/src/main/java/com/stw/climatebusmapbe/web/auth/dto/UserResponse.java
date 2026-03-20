package com.stw.climatebusmapbe.web.auth.dto;

import com.stw.climatebusmapbe.domain.user.User;

public record UserResponse(Long id, String email, String nickname) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getNickname());
    }
}
