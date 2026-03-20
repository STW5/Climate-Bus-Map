package com.stw.climatebusmapbe.domain.alert;

import com.stw.climatebusmapbe.domain.user.UserRepository;
import com.stw.climatebusmapbe.web.push.dto.AlertSettingRequest;
import com.stw.climatebusmapbe.web.push.dto.PushSubscribeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private static final int MAX_ALERTS = 3;

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final AlertSettingRepository alertSettingRepository;
    private final UserRepository userRepository;

    @Transactional
    public void subscribe(Long userId, PushSubscribeRequest req) {
        pushSubscriptionRepository.findByEndpoint(req.endpoint()).ifPresentOrElse(
                existing -> { /* 이미 등록됨, 무시 */ },
                () -> {
                    var user = userRepository.getReferenceById(userId);
                    pushSubscriptionRepository.save(
                            PushSubscription.create(user, req.endpoint(), req.p256dh(), req.auth())
                    );
                }
        );
    }

    @Transactional
    public void unsubscribe(Long userId, String endpoint) {
        pushSubscriptionRepository.deleteByUserIdAndEndpoint(userId, endpoint);
    }

    public List<AlertSetting> getAlerts(Long userId) {
        return alertSettingRepository.findByUserIdOrderByIdDesc(userId);
    }

    @Transactional
    public AlertSetting addAlert(Long userId, AlertSettingRequest req) {
        if (alertSettingRepository.countByUserId(userId) >= MAX_ALERTS) {
            throw new IllegalStateException("알림은 최대 " + MAX_ALERTS + "개까지 설정할 수 있습니다.");
        }
        var user = userRepository.getReferenceById(userId);
        return alertSettingRepository.save(
                AlertSetting.create(user, req.stationId(), req.stationName(),
                        req.routeId(), req.routeName(), req.minutesBefore())
        );
    }

    @Transactional
    public void deleteAlert(Long userId, Long alertId) {
        if (!alertSettingRepository.existsByIdAndUserId(alertId, userId)) {
            throw new IllegalArgumentException("알림 설정을 찾을 수 없습니다.");
        }
        alertSettingRepository.deleteById(alertId);
    }

    @Transactional
    public void toggleAlert(Long userId, Long alertId) {
        AlertSetting setting = alertSettingRepository.findById(alertId)
                .filter(a -> a.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("알림 설정을 찾을 수 없습니다."));
        setting.toggleActive();
    }

    public boolean hasSubscription(Long userId) {
        return pushSubscriptionRepository.existsByUserId(userId);
    }

    public List<PushSubscription> getSubscriptions(Long userId) {
        return pushSubscriptionRepository.findByUserId(userId);
    }
}
