package com.stw.climatebusmapbe.domain.alert;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertSettingRepository extends JpaRepository<AlertSetting, Long> {

    List<AlertSetting> findByUserIdOrderByIdDesc(Long userId);

    List<AlertSetting> findByActiveTrue();

    int countByUserId(Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
