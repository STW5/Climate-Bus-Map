package com.stw.climatebusmapbe.common;

import com.stw.climatebusmapbe.common.exception.ApiRateLimitException;
import com.stw.climatebusmapbe.common.exception.BusApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException e) {
        return ApiResponse.fail(e.getMessage());
    }

    @ExceptionHandler(ApiRateLimitException.class)
    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public ApiResponse<Void> handleApiRateLimit(ApiRateLimitException e) {
        log.warn("서울 버스 API 일일 호출 한도 초과");
        return ApiResponse.fail("API_LIMIT_EXCEEDED");
    }

    @ExceptionHandler(BusApiException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleBusApiException(BusApiException e) {
        return ApiResponse.fail("서울 버스 API 오류: " + e.getMessage());
    }

    @ExceptionHandler(RestClientResponseException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ApiResponse<Void> handleRestClientResponseException(RestClientResponseException e) {
        log.error("서울 버스 API HTTP 오류: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
        return ApiResponse.fail("서울 버스 API 연결 실패 (HTTP " + e.getStatusCode() + ")");
    }

    @ExceptionHandler(RestClientException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ApiResponse<Void> handleRestClientException(RestClientException e) {
        log.error("서울 버스 API 연결 오류: {}", e.getMessage());
        return ApiResponse.fail("서울 버스 API 연결 실패: " + e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleException(Exception e) {
        log.error("서버 오류", e);
        return ApiResponse.fail("서버 오류가 발생했습니다.");
    }
}
