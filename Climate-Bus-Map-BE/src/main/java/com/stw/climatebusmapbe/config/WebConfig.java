package com.stw.climatebusmapbe.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:3000",
                        "http://stw.iptime.org:3002",
                        "https://climatego.duckdns.org"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
