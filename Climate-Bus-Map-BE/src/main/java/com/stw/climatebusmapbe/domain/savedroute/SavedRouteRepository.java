package com.stw.climatebusmapbe.domain.savedroute;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedRouteRepository extends JpaRepository<SavedRoute, Long> {
    List<SavedRoute> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
}
