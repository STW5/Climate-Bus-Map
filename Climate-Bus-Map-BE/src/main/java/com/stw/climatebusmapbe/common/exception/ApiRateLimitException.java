package com.stw.climatebusmapbe.common.exception;

public class ApiRateLimitException extends RuntimeException {

    public ApiRateLimitException() {
        super("일일 API 호출 한도 초과");
    }
}
