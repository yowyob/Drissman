package com.drissman.kernel;

import com.drissman.domain.entity.School;
import com.drissman.domain.entity.User;
import com.drissman.domain.entity.Vehicle;
import com.drissman.domain.repository.SchoolRepository;
import com.drissman.domain.repository.UserRepository;
import com.drissman.domain.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuples;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Reflet des véhicules Drissman vers le resource-core du kernel (DS-RE-05).
 *
 * Best-effort : exécuté en arrière-plan avec le token-miroir de l'admin de
 * l'école ; toute indisponibilité (école non provisionnée, miroir non vérifié,
 * kernel en panne) est loguée sans jamais impacter le flux local.
 *
 * Chaîne validée en production le 2026-07-10 :
 * POST /api/organizations/{orgId}/resources (agence siège requise)
 * puis POST /api/resources/{resourceId}/location-observations
 * (service RESOURCE souscrit à l'organisation).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelResourceService {

    private final KernelClient kernelClient;
    private final KernelAuthService kernelAuthService;
    private final SchoolRepository schoolRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    /** Crée la Resource kernel du véhicule et mémorise son id. */
    public void mirrorVehicleInBackground(Vehicle vehicle) {
        mirrorVehicle(vehicle)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        v -> {
                        },
                        e -> log.info("Reflet kernel du véhicule {} indisponible : {}",
                                vehicle.getPlateNumber(), e.getMessage()));
    }

    /** Pousse la position GPS vers l'historique kernel du véhicule. */
    public void pushPositionInBackground(Vehicle vehicle) {
        if (vehicle.getKernelResourceId() == null || vehicle.getLatitude() == null) {
            return;
        }
        schoolContext(vehicle.getSchoolId())
                .flatMap(ctx -> kernelClient.post(
                        "/api/resources/" + vehicle.getKernelResourceId() + "/location-observations",
                        Map.of("latitude", vehicle.getLatitude(), "longitude", vehicle.getLongitude()),
                        KernelClient.bearerWithOrganization(ctx.getT2(), ctx.getT1().toString())))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        r -> {
                        },
                        e -> log.debug("Observation GPS kernel indisponible pour {} : {}",
                                vehicle.getPlateNumber(), e.getMessage()));
    }

    Mono<Void> mirrorVehicle(Vehicle vehicle) {
        if (vehicle.getKernelResourceId() != null) {
            return Mono.empty();
        }
        return schoolContext(vehicle.getSchoolId())
                .flatMap(ctx -> {
                    UUID orgId = ctx.getT1();
                    String token = ctx.getT2();
                    Map<String, String> headers = KernelClient.bearerWithOrganization(token, orgId.toString());

                    // L'agence siège est créée automatiquement avec l'organisation.
                    return kernelClient.get("/api/organizations/" + orgId + "/agencies", headers)
                            .flatMap(agencies -> {
                                String agencyId = agencies.getData() != null && agencies.getData().isArray()
                                        && agencies.getData().size() > 0
                                                ? agencies.getData().get(0).path("id").asText(null)
                                                : null;
                                if (agencyId == null) {
                                    return Mono.error(new IllegalStateException("Aucune agence kernel"));
                                }
                                Map<String, Object> body = new HashMap<>();
                                body.put("agencyId", agencyId);
                                body.put("resourceCode", resourceCode(vehicle));
                                body.put("name", vehicle.getName());
                                body.put("category", "VEHICLE");
                                body.put("serialNumber", vehicle.getPlateNumber());
                                if (vehicle.getLatitude() != null) {
                                    body.put("latitude", vehicle.getLatitude());
                                    body.put("longitude", vehicle.getLongitude());
                                }
                                return kernelClient.post("/api/organizations/" + orgId + "/resources",
                                        body, headers);
                            });
                })
                .flatMap(response -> {
                    String resourceId = response.getData() != null
                            ? response.getData().path("id").asText(null)
                            : null;
                    if (resourceId == null) {
                        return Mono.empty();
                    }
                    vehicle.setKernelResourceId(UUID.fromString(resourceId));
                    log.info("Véhicule {} reflété dans resource-core : {}",
                            vehicle.getPlateNumber(), resourceId);
                    return vehicleRepository.save(vehicle).then();
                });
    }

    /**
     * Contexte kernel d'une école : (organizationId, token admin).
     * Vide si l'école n'est pas provisionnée ou si aucun token n'est possible.
     */
    private Mono<reactor.util.function.Tuple2<UUID, String>> schoolContext(UUID schoolId) {
        return schoolRepository.findById(schoolId)
                .filter(school -> school.getKernelOrganizationId() != null)
                .flatMap(school -> userRepository
                        .findFirstBySchoolIdAndRole(schoolId, User.Role.SCHOOL_ADMIN)
                        .flatMap(kernelAuthService::ensureToken)
                        .map(token -> Tuples.of(school.getKernelOrganizationId(), token)));
    }

    private String resourceCode(Vehicle vehicle) {
        String plate = vehicle.getPlateNumber() != null
                ? vehicle.getPlateNumber().replaceAll("[^A-Za-z0-9]", "")
                : vehicle.getId().toString().substring(0, 8);
        return "VH-" + plate.toUpperCase(Locale.ROOT);
    }
}
