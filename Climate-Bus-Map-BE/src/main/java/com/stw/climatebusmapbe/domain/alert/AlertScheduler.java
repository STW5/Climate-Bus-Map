package com.stw.climatebusmapbe.domain.alert;

import com.stw.climatebusmapbe.external.busapi.BusApiPort;
import com.stw.climatebusmapbe.external.webpush.WebPushAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class AlertScheduler {

    private final AlertSettingRepository alertSettingRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final BusApiPort busApiPort;
    private final WebPushAdapter webPushAdapter;

    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void checkAndSendAlerts() {
        List<AlertSetting> activeAlerts = alertSettingRepository.findByActiveTrue();
        if (activeAlerts.isEmpty()) return;

        // stationId별로 그룹화하여 API 중복 호출 방지
        Map<String, List<AlertSetting>> byStation = activeAlerts.stream()
                .collect(Collectors.groupingBy(AlertSetting::getStationId));

        byStation.forEach((stationId, alerts) -> {
            try {
                var arrivals = busApiPort.getArrivals(stationId);
                for (AlertSetting alert : alerts) {
                    if (!alert.canSendNow()) continue;

                    arrivals.stream()
                            .filter(a -> a.getRouteId().equals(alert.getRouteId()))
                            .filter(a -> a.getArrivalSec1() > 0 && a.getArrivalSec1() <= alert.getMinutesBefore() * 60)
                            .findFirst()
                            .ifPresent(arrival -> {
                                int minLeft = arrival.getArrivalSec1() / 60;
                                sendAlertToUser(alert, minLeft);
                            });
                }
            } catch (Exception e) {
                log.debug("알림 체크 중 오류 stationId={}: {}", stationId, e.getMessage());
            }
        });
    }

    private void sendAlertToUser(AlertSetting alert, int minutesLeft) {
        List<PushSubscription> subs = pushSubscriptionRepository.findByUserId(alert.getUser().getId());
        if (subs.isEmpty()) return;

        String title = alert.getRouteName() + " 버스 도착 예정";
        String body = alert.getStationName() + " " + minutesLeft + "분 후 도착";

        for (PushSubscription sub : subs) {
            webPushAdapter.send(sub, title, body);
        }
        alert.markSent();
        log.info("알림 발송: userId={}, route={}, station={}, {}분 후",
                alert.getUser().getId(), alert.getRouteName(), alert.getStationName(), minutesLeft);
    }
}
