package com.drissman.api.controller;

import com.drissman.api.dto.VehicleDto;
import com.drissman.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Suivi des véhicules côté consommateurs (P5).
 * - Les moniteurs poussent leur position (app mobile / navigateur).
 * - Les candidats/écoles suivent la flotte en SSE sur la carte.
 */
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    /** Position courante des véhicules actifs d'une école. */
    @GetMapping("/school/{schoolId}")
    public Flux<VehicleDto> bySchool(@PathVariable UUID schoolId) {
        return vehicleService.getForSchool(schoolId);
    }

    /**
     * Mise à jour de position (moniteur / dispositif embarqué).
     * Réservée aux séances de conduite / examen blanc en cours (cf. service).
     */
    @PostMapping("/{vehicleId}/position")
    public Mono<VehicleDto> updatePosition(java.security.Principal principal,
            @PathVariable UUID vehicleId,
            @RequestBody Map<String, Double> body) {
        if (principal == null) {
            return Mono.error(new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }
        Double lat = body.get("latitude");
        Double lng = body.get("longitude");
        if (lat == null || lng == null) {
            return Mono.error(new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "latitude et longitude requis"));
        }
        return vehicleService.updatePosition(vehicleId, lat, lng, UUID.fromString(principal.getName()));
    }

    /**
     * Flux temps réel SSE des positions d'une école.
     * Heartbeat toutes les 25 s pour maintenir la connexion à travers les proxys.
     */
    @GetMapping(value = "/school/{schoolId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<VehicleDto>> stream(@PathVariable UUID schoolId) {
        Flux<ServerSentEvent<VehicleDto>> positions = vehicleService.streamForSchool(schoolId)
                .map(dto -> ServerSentEvent.<VehicleDto>builder()
                        .event("position")
                        .data(dto)
                        .build());

        Flux<ServerSentEvent<VehicleDto>> heartbeat = Flux.interval(Duration.ofSeconds(25))
                .map(i -> ServerSentEvent.<VehicleDto>builder().comment("keep-alive").build());

        return Flux.merge(positions, heartbeat);
    }
}
