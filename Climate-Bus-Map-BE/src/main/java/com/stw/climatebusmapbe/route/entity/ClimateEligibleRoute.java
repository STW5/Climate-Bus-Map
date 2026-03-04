package com.stw.climatebusmapbe.route.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "climate_eligible_routes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClimateEligibleRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "route_id", nullable = false, unique = true, length = 20)
    private String routeId;

    @Column(name = "route_no", nullable = false, length = 20)
    private String routeNo;

    @Column(name = "route_type", length = 10)
    private String routeType;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
