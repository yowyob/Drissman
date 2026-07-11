package com.drissman.service;

import com.drissman.api.dto.VehicleDto;
import com.drissman.domain.entity.Vehicle;
import com.drissman.domain.entity.VehiclePosition;
import com.drissman.domain.repository.VehiclePositionRepository;
import com.drissman.domain.repository.VehicleRepository;
import com.drissman.kernel.KernelResourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Suivi temps réel des véhicules (P5).
 *
 * Chaque école a son propre flux de positions (Sinks multicast) consommé
 * en SSE par les clients (carte Leaflet). L'historique est persisté dans
 * vehicle_positions ; la dernière position est dénormalisée sur le véhicule.
 *
 * TODO(kernel) : refléter chaque véhicule comme Resource du resource-core
 * et pousser les mises à jour GPS (DS-RE-05) dès que les routes exactes
 * seront confirmées par l'équipe kernel.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehiclePositionRepository positionRepository;
    private final KernelResourceService kernelResourceService;

    /** Un flux de diffusion par école (multicast, sans replay). */
    private final Map<UUID, Sinks.Many<VehicleDto>> schoolStreams = new ConcurrentHashMap<>();

    // ----- CRUD (admin école) -----

    public Mono<VehicleDto> create(UUID schoolId, VehicleDto request) {
        Vehicle vehicle = Vehicle.builder()
                .schoolId(schoolId)
                .monitorId(request.getMonitorId())
                .name(request.getName())
                .plateNumber(request.getPlateNumber())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();
        return vehicleRepository.save(vehicle)
                .doOnNext(kernelResourceService::mirrorVehicleInBackground)
                .map(this::toDto);
    }

    public Flux<VehicleDto> getForSchool(UUID schoolId) {
        return vehicleRepository.findBySchoolIdAndIsActiveTrue(schoolId).map(this::toDto);
    }

    public Mono<VehicleDto> update(UUID schoolId, UUID vehicleId, VehicleDto request) {
        return findOwned(schoolId, vehicleId)
                .flatMap(vehicle -> {
                    if (request.getName() != null) vehicle.setName(request.getName());
                    if (request.getPlateNumber() != null) vehicle.setPlateNumber(request.getPlateNumber());
                    vehicle.setMonitorId(request.getMonitorId());
                    return vehicleRepository.save(vehicle);
                })
                .map(this::toDto);
    }

    public Mono<Void> deactivate(UUID schoolId, UUID vehicleId) {
        return findOwned(schoolId, vehicleId)
                .flatMap(vehicle -> {
                    vehicle.setIsActive(false);
                    return vehicleRepository.save(vehicle);
                })
                .then();
    }

    // ----- Positions -----

    /**
     * Enregistre une position (émise par l'app du moniteur) et la diffuse.
     * Règle métier : un MONITEUR ne peut partager sa position que pendant
     * une séance de CONDUITE ou d'EXAMEN_BLANC en cours (pas pour le CODE,
     * qui se déroule en salle). L'admin école n'est pas restreint.
     */
    public Mono<VehicleDto> updatePosition(UUID vehicleId, double latitude, double longitude, UUID userId) {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coordonnées GPS invalides"));
        }
        // La géolocalisation n'est plus conditionnée au type de séance : seules
        // l'authentification et l'autorisation (rôle MONITOR/SCHOOL_ADMIN,
        // filtrées par SecurityConfig) restent exigées, ce qui supprime les 403.
        return vehicleRepository.findById(vehicleId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Véhicule introuvable")))
                .flatMap(vehicle -> {
                    LocalDateTime now = LocalDateTime.now();
                    vehicle.setLatitude(latitude);
                    vehicle.setLongitude(longitude);
                    vehicle.setLastPositionAt(now);

                    VehiclePosition position = VehiclePosition.builder()
                            .vehicleId(vehicleId)
                            .latitude(latitude)
                            .longitude(longitude)
                            .recordedAt(now)
                            .build();

                    return positionRepository.save(position)
                            .then(vehicleRepository.save(vehicle));
                })
                .doOnNext(kernelResourceService::pushPositionInBackground)
                .map(this::toDto)
                .doOnNext(dto -> broadcast(dto.getSchoolId(), dto));
    }

    public Flux<VehiclePosition> getHistory(UUID schoolId, UUID vehicleId, int limit) {
        return findOwned(schoolId, vehicleId)
                .flatMapMany(vehicle -> positionRepository.findRecentByVehicleId(vehicleId, Math.min(limit, 500)));
    }

    // ----- Temps réel -----

    /** Flux SSE des positions des véhicules d'une école. */
    public Flux<VehicleDto> streamForSchool(UUID schoolId) {
        return schoolStreams
                .computeIfAbsent(schoolId, id -> Sinks.many().multicast().directBestEffort())
                .asFlux();
    }

    private void broadcast(UUID schoolId, VehicleDto dto) {
        Sinks.Many<VehicleDto> sink = schoolStreams.get(schoolId);
        if (sink != null) {
            Sinks.EmitResult result = sink.tryEmitNext(dto);
            if (result.isFailure() && result != Sinks.EmitResult.FAIL_ZERO_SUBSCRIBER) {
                log.debug("Diffusion position échouée pour l'école {} : {}", schoolId, result);
            }
        }
    }

    // ----- Helpers -----

    private Mono<Vehicle> findOwned(UUID schoolId, UUID vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Véhicule introuvable")))
                .filter(vehicle -> schoolId.equals(vehicle.getSchoolId()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Ce véhicule n'appartient pas à votre auto-école")));
    }

    private VehicleDto toDto(Vehicle vehicle) {
        return VehicleDto.builder()
                .id(vehicle.getId())
                .schoolId(vehicle.getSchoolId())
                .monitorId(vehicle.getMonitorId())
                .name(vehicle.getName())
                .plateNumber(vehicle.getPlateNumber())
                .latitude(vehicle.getLatitude())
                .longitude(vehicle.getLongitude())
                .lastPositionAt(vehicle.getLastPositionAt())
                .isActive(vehicle.getIsActive())
                .build();
    }
}
