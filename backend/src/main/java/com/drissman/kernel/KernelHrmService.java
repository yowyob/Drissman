package com.drissman.kernel;

import com.drissman.domain.entity.Monitor;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.MonitorRepository;
import com.drissman.domain.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Miroir des moniteurs Drissman en employés du module HRM du kernel (10-hrm).
 *
 * Flux (best-effort, jamais bloquant) :
 *   1. compte-miroir + token du moniteur          (ensureToken)
 *   2. résolution de son actorId                  GET /api/actors/me
 *   3. création de l'employé                       POST /api/v1/hrm/employees
 *      { actorId, position, dateEmbauche } + X-Organization-Id (org Drissman)
 *
 * MODÈLE A : l'organisation est celle de Drissman (unique). Nécessite le service
 * HRM souscrit à cette organisation ; sinon l'appel échoue (FAIL) sans impact.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelHrmService {

    private final KernelClient kernelClient;
    private final KernelAuthService kernelAuthService;
    private final KernelOrganization kernelOrganization;
    private final UserRepository userRepository;
    private final MonitorRepository monitorRepository;

    /** Reflète un moniteur en employé kernel, sans bloquer sa création locale. */
    public void mirrorMonitorInBackground(Monitor monitor) {
        if (monitor == null || monitor.getUserId() == null) {
            return; // pas de compte utilisateur => pas d'employé possible
        }
        userRepository.findById(monitor.getUserId())
                .flatMap(user -> mirrorMonitor(user, monitor))
                .flatMap(employeeId -> {
                    monitor.setKernelEmployeeId(employeeId);
                    return monitorRepository.save(monitor);
                })
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(v -> {}, e -> log.debug("Miroir HRM indisponible pour moniteur {} : {}",
                        monitor.getId(), e.getMessage()));
    }

    /** Renvoie l'employeeId kernel créé, ou Mono.empty() en best-effort. */
    Mono<UUID> mirrorMonitor(User monitorUser, Monitor monitor) {
        UUID orgId = kernelOrganization.id().orElse(null);
        Object ref = monitor.getId();
        if (orgId == null) {
            KernelMirrorLog.skip("hrm.employee", ref,
                    "KERNEL_ORGANIZATION_ID non configuré (organisation Drissman)");
            return Mono.empty();
        }

        return kernelAuthService.ensureToken(monitorUser)
                .switchIfEmpty(Mono.defer(() -> {
                    KernelMirrorLog.skip("hrm.employee", ref, "token-miroir moniteur indisponible");
                    return Mono.empty();
                }))
                .flatMap(token -> resolveActorId(token)
                        .switchIfEmpty(Mono.defer(() -> {
                            KernelMirrorLog.skip("hrm.employee", ref, "actorId moniteur introuvable");
                            return Mono.empty();
                        }))
                        .flatMap(actorId -> {
                            Map<String, Object> body = new HashMap<>();
                            body.put("actorId", actorId);
                            body.put("position", "Moniteur auto-école");
                            body.put("dateEmbauche", LocalDate.now().toString());

                            Map<String, String> headers = KernelClient.bearerWithOrganization(token, orgId.toString());
                            return kernelClient.post("/api/v1/hrm/employees", body, headers)
                                    .map(resp -> {
                                        UUID employeeId = extractUuid(resp);
                                        KernelMirrorLog.ok("hrm.employee", ref,
                                                "actorId=" + actorId + " employeeId=" + employeeId);
                                        return employeeId;
                                    })
                                    .flatMap(id -> id != null ? Mono.just(id) : Mono.empty());
                        }))
                .doOnError(e -> KernelMirrorLog.fail("hrm.employee", ref, e, errorBody(e)))
                .onErrorResume(e -> Mono.empty());
    }

    /** actorId du compte connecté via GET /api/actors/me (champ résolu défensivement). */
    private Mono<UUID> resolveActorId(String token) {
        return kernelClient.get("/api/actors/me", KernelClient.bearer(token))
                .flatMap(resp -> {
                    JsonNode d = resp.getData();
                    UUID actorId = firstUuid(d, "id", "actorId", "actor");
                    return actorId != null ? Mono.just(actorId) : Mono.empty();
                });
    }

    private static UUID firstUuid(JsonNode node, String... fields) {
        if (node == null) return null;
        for (String f : fields) {
            String v = node.path(f).asText(null);
            UUID u = toUuid(v);
            if (u != null) return u;
        }
        return null;
    }

    private static UUID extractUuid(KernelResponse resp) {
        if (resp == null || resp.getData() == null) return null;
        return firstUuid(resp.getData(), "id", "employeeId");
    }

    private static UUID toUuid(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return UUID.fromString(v);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String errorBody(Throwable e) {
        if (e instanceof WebClientResponseException w) {
            String body = w.getResponseBodyAsString();
            if (body != null && !body.isBlank()) {
                return body.length() > 500 ? body.substring(0, 500) : body;
            }
        }
        return "";
    }
}
