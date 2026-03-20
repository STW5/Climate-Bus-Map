package com.stw.climatebusmapbe.domain.user;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username; // 로그인 아이디

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String nickname;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public static User create(String username, String passwordHash, String nickname) {
        User user = new User();
        user.username = username;
        user.passwordHash = passwordHash;
        user.nickname = nickname;
        return user;
    }
}
