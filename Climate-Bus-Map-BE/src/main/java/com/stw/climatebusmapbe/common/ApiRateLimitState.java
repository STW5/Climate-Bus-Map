package com.stw.climatebusmapbe.common;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 서울 버스 API 일일 호출 한도 초과 상태 관리 (인메모리, 자정 자동 리셋)
 */
@Component
public class ApiRateLimitState {

    private final AtomicBoolean limited = new AtomicBoolean(false);
    private volatile LocalDate limitedDate = null;

    /**
     * 오늘 한도가 초과된 상태인지 확인.
     * 날짜가 바뀌었으면 자동으로 false 반환 (자정 리셋).
     */
    public boolean isLimited() {
        if (!limited.get()) return false;
        if (!LocalDate.now().equals(limitedDate)) {
            limited.set(false);
            limitedDate = null;
            return false;
        }
        return true;
    }

    /**
     * 오늘 한도 초과 상태로 표시.
     */
    public void markLimited() {
        limitedDate = LocalDate.now();
        limited.set(true);
    }
}
