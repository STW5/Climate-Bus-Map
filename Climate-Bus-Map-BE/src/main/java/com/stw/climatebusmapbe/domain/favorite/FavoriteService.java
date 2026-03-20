package com.stw.climatebusmapbe.domain.favorite;

import com.stw.climatebusmapbe.domain.user.User;
import com.stw.climatebusmapbe.domain.user.UserRepository;
import com.stw.climatebusmapbe.web.favorite.dto.FavoriteRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;

    public List<Favorite> getAll(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Favorite add(Long userId, FavoriteRequest req) {
        if (favoriteRepository.existsByUserIdAndStationId(userId, req.stationId())) {
            return favoriteRepository.findByUserIdAndStationId(userId, req.stationId()).orElseThrow();
        }
        User user = userRepository.getReferenceById(userId);
        return favoriteRepository.save(
                Favorite.create(user, req.stationId(), req.stationName(), req.arsId(), req.lat(), req.lng())
        );
    }

    @Transactional
    public void remove(Long userId, String stationId) {
        favoriteRepository.deleteByUserIdAndStationId(userId, stationId);
    }

    @Transactional
    public void bulkAdd(Long userId, List<FavoriteRequest> items) {
        User user = userRepository.getReferenceById(userId);
        for (FavoriteRequest req : items) {
            if (!favoriteRepository.existsByUserIdAndStationId(userId, req.stationId())) {
                favoriteRepository.save(
                        Favorite.create(user, req.stationId(), req.stationName(), req.arsId(), req.lat(), req.lng())
                );
            }
        }
    }
}
