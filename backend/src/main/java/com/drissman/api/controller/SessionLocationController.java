package com.drissman.api.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/sessions")
public class SessionLocationController {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationDto {
        private String id;
        private String sessionId;
        private Double latitude;
        private Double longitude;
        private Double speed;
        private Double heading;
        private Long timestamp;
    }

    private final Map<UUID, List<LocationDto>> sessionTrails = new ConcurrentHashMap<>();
    private final Map<UUID, LocationDto> latestLocations = new ConcurrentHashMap<>();

    @PostMapping("/{sessionId}/locations")
    public Mono<LocationDto> recordLocation(@PathVariable UUID sessionId, @RequestBody Map<String, Object> body) {
        Double lat = body.get("latitude") != null ? ((Number) body.get("latitude")).doubleValue() : 0.0;
        Double lng = body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : 0.0;
        Double speed = body.get("speed") != null ? ((Number) body.get("speed")).doubleValue() : 0.0;
        Double heading = body.get("heading") != null ? ((Number) body.get("heading")).doubleValue() : 0.0;

        LocationDto loc = new LocationDto(
                UUID.randomUUID().toString(),
                sessionId.toString(),
                lat,
                lng,
                speed,
                heading,
                System.currentTimeMillis()
        );

        latestLocations.put(sessionId, loc);
        sessionTrails.computeIfAbsent(sessionId, k -> new ArrayList<>()).add(loc);

        return Mono.just(loc);
    }

    @GetMapping("/{sessionId}/locations/latest")
    public Mono<LocationDto> getLatestLocation(@PathVariable UUID sessionId) {
        LocationDto loc = latestLocations.get(sessionId);
        if (loc == null) {
            return Mono.empty();
        }
        return Mono.just(loc);
    }

    @GetMapping("/{sessionId}/locations/trail")
    public Flux<LocationDto> getTrail(@PathVariable UUID sessionId) {
        List<LocationDto> trail = sessionTrails.getOrDefault(sessionId, new ArrayList<>());
        return Flux.fromIterable(trail);
    }
}
