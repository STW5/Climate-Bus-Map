package com.stw.climatebusmapbe.domain.ride;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RideLogRepository extends JpaRepository<RideLog, Long> {

    @Query("SELECT r FROM RideLog r WHERE r.user.id = :userId ORDER BY r.createdAt DESC")
    List<RideLog> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM RideLog r WHERE r.user.id = :userId AND r.rideDate >= :from AND r.rideDate <= :to")
    long countByUserIdAndDateBetween(@Param("userId") Long userId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    long countByUserId(Long userId);
}
