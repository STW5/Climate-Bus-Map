package com.stw.climatebusmapbe.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // CORS는 SecurityConfig의 CorsConfigurationSource에서 통합 관리
    // Spring Security 필터 체인이 먼저 처리하므로 여기서는 설정 불필요
    @Override
    public void addCorsMappings(CorsRegistry registry) {
    }
}
