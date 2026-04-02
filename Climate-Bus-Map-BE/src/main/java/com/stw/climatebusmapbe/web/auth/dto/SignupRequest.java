package com.stw.climatebusmapbe.web.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank(message = "아이디를 입력해 주세요")
        @Size(min = 4, max = 20, message = "아이디는 4~20자여야 합니다")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "아이디는 영문, 숫자, 밑줄만 사용 가능합니다")
        String username,

        @NotBlank(message = "비밀번호를 입력해 주세요")
        @Size(min = 8, max = 100, message = "비밀번호는 8자 이상이어야 합니다")
        String password,

        @NotBlank(message = "닉네임을 입력해 주세요")
        @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다")
        String nickname
) {}
