package com.stw.climatebusmapbe.domain.savedroute;

import com.stw.climatebusmapbe.domain.user.UserRepository;
import com.stw.climatebusmapbe.web.savedroute.dto.SaveRouteRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedRouteService {

    private static final int MAX_ROUTES = 10;

    private final SavedRouteRepository savedRouteRepository;
    private final UserRepository userRepository;

    public List<SavedRoute> getAll(Long userId) {
        return savedRouteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public SavedRoute getDetail(Long userId, Long routeId) {
        SavedRoute route = savedRouteRepository.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("저장된 경로를 찾을 수 없습니다."));
        if (!route.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        return route;
    }

    @Transactional
    public SavedRoute save(Long userId, SaveRouteRequest req) {
        if (savedRouteRepository.countByUserId(userId) >= MAX_ROUTES) {
            throw new IllegalArgumentException("저장 경로는 최대 " + MAX_ROUTES + "개입니다.");
        }
        var user = userRepository.getReferenceById(userId);
        return savedRouteRepository.save(
                SavedRoute.create(user, req.name(), req.startName(), req.endName(), req.routeJson())
        );
    }

    @Transactional
    public void delete(Long userId, Long routeId) {
        SavedRoute route = savedRouteRepository.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("저장된 경로를 찾을 수 없습니다."));
        if (!route.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        savedRouteRepository.delete(route);
    }
}
