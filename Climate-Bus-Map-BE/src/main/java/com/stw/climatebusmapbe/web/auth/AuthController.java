package com.stw.climatebusmapbe.web.auth;

import com.stw.climatebusmapbe.common.ApiResponse;
import com.stw.climatebusmapbe.common.security.JwtProvider;
import com.stw.climatebusmapbe.domain.user.User;
import com.stw.climatebusmapbe.domain.user.UserService;
import com.stw.climatebusmapbe.web.auth.dto.LoginRequest;
import com.stw.climatebusmapbe.web.auth.dto.SignupRequest;
import com.stw.climatebusmapbe.web.auth.dto.UserResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtProvider jwtProvider;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @GetMapping("/check-username")
    public ApiResponse<Boolean> checkUsername(@RequestParam String username) {
        return ApiResponse.ok(userService.isUsernameTaken(username));
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> signup(@Valid @RequestBody SignupRequest req, HttpServletResponse res) {
        User user = userService.signup(req.username(), req.password(), req.nickname());
        setTokenCookies(res, user.getId());
        return ApiResponse.ok(UserResponse.from(user));
    }

    @PostMapping("/login")
    public ApiResponse<UserResponse> login(@Valid @RequestBody LoginRequest req, HttpServletResponse res) {
        User user = userService.login(req.username(), req.password());
        setTokenCookies(res, user.getId());
        return ApiResponse.ok(UserResponse.from(user));
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal Long userId) {
        if (userId == null) {
            return ApiResponse.fail("UNAUTHORIZED");
        }
        User user = userService.findById(userId);
        return ApiResponse.ok(UserResponse.from(user));
    }

    @PostMapping("/refresh")
    public ApiResponse<Void> refresh(HttpServletRequest req, HttpServletResponse res) {
        String refreshToken = extractCookie(req, "refresh_token");
        if (refreshToken == null || !jwtProvider.isValid(refreshToken)) {
            res.setStatus(HttpStatus.UNAUTHORIZED.value());
            return ApiResponse.fail("INVALID_REFRESH_TOKEN");
        }
        Long userId = jwtProvider.getUserId(refreshToken);
        addCookie(res, "access_token", jwtProvider.generateAccessToken(userId), 3600);
        return ApiResponse.ok(null);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletResponse res) {
        clearCookie(res, "access_token");
        clearCookie(res, "refresh_token");
        return ApiResponse.ok(null);
    }

    // ── 쿠키 유틸 ─────────────────────────────────────
    private void setTokenCookies(HttpServletResponse res, Long userId) {
        addCookie(res, "access_token", jwtProvider.generateAccessToken(userId), 3600);
        addCookie(res, "refresh_token", jwtProvider.generateRefreshToken(userId), 604800);
    }

    private void addCookie(HttpServletResponse res, String name, String value, int maxAge) {
        String secure = cookieSecure ? "; Secure" : "";
        String header = String.format("%s=%s; Path=/; Max-Age=%d; HttpOnly%s; SameSite=Lax",
                name, value, maxAge, secure);
        res.addHeader("Set-Cookie", header);
    }

    private void clearCookie(HttpServletResponse res, String name) {
        String secure = cookieSecure ? "; Secure" : "";
        String header = String.format("%s=; Path=/; Max-Age=0; HttpOnly%s; SameSite=Lax", name, secure);
        res.addHeader("Set-Cookie", header);
    }

    private String extractCookie(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return null;
        for (Cookie c : req.getCookies()) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
