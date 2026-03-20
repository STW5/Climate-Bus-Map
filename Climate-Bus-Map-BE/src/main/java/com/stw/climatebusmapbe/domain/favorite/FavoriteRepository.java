package com.stw.climatebusmapbe.domain.favorite;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Favorite> findByUserIdAndStationId(Long userId, String stationId);
    boolean existsByUserIdAndStationId(Long userId, String stationId);
    void deleteByUserIdAndStationId(Long userId, String stationId);
}
