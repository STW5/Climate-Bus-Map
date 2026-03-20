package com.stw.climatebusmapbe.domain.alert;

import com.stw.climatebusmapbe.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "alert_settings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "station_id", "route_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AlertSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "station_id", nullable = false, length = 50)
    private String stationId;

    @Column(name = "station_name", nullable = false, length = 100)
    private String stationName;

    @Column(name = "route_id", nullable = false, length = 50)
    private String routeId;

    @Column(name = "route_name", nullable = false, length = 50)
    private String routeName;

    @Column(name = "minutes_before")
    private int minutesBefore = 5;

    @Column
    private boolean active = true;

    @Column(name = "last_sent_at")
    private LocalDateTime lastSentAt;

    public static AlertSetting create(User user, String stationId, String stationName,
                                      String routeId, String routeName, int minutesBefore) {
        AlertSetting a = new AlertSetting();
        a.user = user;
        a.stationId = stationId;
        a.stationName = stationName;
        a.routeId = routeId;
        a.routeName = routeName;
        a.minutesBefore = minutesBefore;
        return a;
    }

    public void toggleActive() {
        this.active = !this.active;
    }

    public void markSent() {
        this.lastSentAt = LocalDateTime.now();
    }

    public boolean canSendNow() {
        if (lastSentAt == null) return true;
        return lastSentAt.isBefore(LocalDateTime.now().minusMinutes(15));
    }
}
