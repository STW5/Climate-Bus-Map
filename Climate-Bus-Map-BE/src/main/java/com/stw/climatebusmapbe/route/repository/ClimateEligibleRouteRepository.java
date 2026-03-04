package com.stw.climatebusmapbe.route.repository;

import com.stw.climatebusmapbe.route.entity.ClimateEligibleRoute;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClimateEligibleRouteRepository extends JpaRepository<ClimateEligibleRoute, Long> {

    boolean existsByRouteId(String routeId);
}
