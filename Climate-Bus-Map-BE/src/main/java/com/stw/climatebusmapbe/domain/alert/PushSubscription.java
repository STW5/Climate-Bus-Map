package com.stw.climatebusmapbe.domain.alert;

import com.stw.climatebusmapbe.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "push_subscriptions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String endpoint;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String p256dh;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String auth;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public static PushSubscription create(User user, String endpoint, String p256dh, String auth) {
        PushSubscription s = new PushSubscription();
        s.user = user;
        s.endpoint = endpoint;
        s.p256dh = p256dh;
        s.auth = auth;
        return s;
    }
}
