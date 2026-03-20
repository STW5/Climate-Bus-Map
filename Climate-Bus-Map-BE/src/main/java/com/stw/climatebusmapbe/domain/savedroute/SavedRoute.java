package com.stw.climatebusmapbe.domain.savedroute;

import com.stw.climatebusmapbe.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_routes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SavedRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "start_name", nullable = false, length = 100)
    private String startName;

    @Column(name = "end_name", nullable = false, length = 100)
    private String endName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "route_json", nullable = false, columnDefinition = "jsonb")
    private String routeJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public static SavedRoute create(User user, String name, String startName, String endName, String routeJson) {
        SavedRoute r = new SavedRoute();
        r.user = user;
        r.name = name;
        r.startName = startName;
        r.endName = endName;
        r.routeJson = routeJson;
        return r;
    }
}
