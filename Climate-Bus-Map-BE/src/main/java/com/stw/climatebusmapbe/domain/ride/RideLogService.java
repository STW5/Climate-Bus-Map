package com.stw.climatebusmapbe.domain.ride;

import com.stw.climatebusmapbe.domain.user.User;
import com.stw.climatebusmapbe.domain.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RideLogService {

    private final RideLogRepository rideLogRepository;
    private final UserService userService;

    @Transactional
    public RideLog logRide(Long userId, String routeId, String routeName, String stationId) {
        User user = userService.findById(userId);
        return rideLogRepository.save(RideLog.create(user, routeId, routeName, stationId));
    }

    @Transactional(readOnly = true)
    public RideStats getStats(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate lastMonthStart = monthStart.minusMonths(1);
        LocalDate lastMonthEnd = monthStart.minusDays(1);

        long thisMonth = rideLogRepository.countByUserIdAndDateBetween(userId, monthStart, today);
        long lastMonth = rideLogRepository.countByUserIdAndDateBetween(userId, lastMonthStart, lastMonthEnd);
        long total = rideLogRepository.countByUserId(userId);
        List<RideLog> recent = rideLogRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId);

        return new RideStats(thisMonth, lastMonth, total, recent);
    }

    public record RideStats(long thisMonth, long lastMonth, long total, List<RideLog> recent) {}
}
