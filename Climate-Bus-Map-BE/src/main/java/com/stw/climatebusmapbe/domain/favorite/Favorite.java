package com.stw.climatebusmapbe.domain.favorite;

import com.stw.climatebusmapbe.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "favorites",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "station_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Favorite {

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

    @Column(name = "ars_id", length = 20)
    private String arsId;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public static Favorite create(User user, String stationId, String stationName, String arsId, double lat, double lng) {
        Favorite f = new Favorite();
        f.user = user;
        f.stationId = stationId;
        f.stationName = stationName;
        f.arsId = arsId;
        f.lat = lat;
        f.lng = lng;
        return f;
    }
}
