package com.stw.climatebusmapbe.domain.ride;

import com.stw.climatebusmapbe.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ride_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RideLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "ride_date", nullable = false)
    private LocalDate rideDate;

    @Column(name = "route_id", length = 50)
    private String routeId;

    @Column(name = "route_name", length = 50)
    private String routeName;

    @Column(name = "station_id", length = 50)
    private String stationId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public static RideLog create(User user, String routeId, String routeName, String stationId) {
        RideLog r = new RideLog();
        r.user = user;
        r.rideDate = LocalDate.now();
        r.routeId = routeId;
        r.routeName = routeName;
        r.stationId = stationId;
        return r;
    }
}
