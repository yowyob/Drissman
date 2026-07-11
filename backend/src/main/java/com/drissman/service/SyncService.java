package com.drissman.service;

import com.drissman.api.dto.SyncBatchRequest;
import com.drissman.api.dto.SyncOperationResult;
import com.drissman.domain.entity.Session;
import com.drissman.domain.entity.SyncOperation;
import com.drissman.domain.repository.SessionRepository;
import com.drissman.domain.repository.SyncOperationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Synchronisation des opérations créées hors ligne (mode PWA).
 *
 * Chaque opération porte un UUID client qui sert de clé d'idempotence :
 * le résultat du premier traitement est mémorisé dans sync_operations, et tout
 * rejeu retourne ce résultat sans ré-exécuter l'action. Les règles métier et
 * les autorisations sont revalidées par les services existants au moment de la
 * synchronisation (jamais au moment de la saisie hors ligne).
 *
 * Statuts retournés au client :
 *   SYNCED             opération appliquée ;
 *   ALREADY_PROCESSED  rejeu d'une opération déjà traitée (résultat mémorisé) ;
 *   CONFLICT           l'état serveur a changé de façon incompatible ;
 *   INVALID            refusée par les règles métier (non rejouable) ;
 *   TEMPORARY_ERROR    erreur transitoire (rejouable par le client).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    public static final String OP_SESSION_COMPLETE = "SESSION_COMPLETE";
    public static final String OP_VEHICLE_POSITION = "VEHICLE_POSITION";

    private final SyncOperationRepository syncOperationRepository;
    private final SessionRepository sessionRepository;
    private final SessionService sessionService;
    private final VehicleService vehicleService;

    public Flux<SyncOperationResult> processBatch(UUID userId, SyncBatchRequest request) {
        if (request == null || request.getOperations() == null) {
            return Flux.empty();
        }
        // concatMap : ordre du lot préservé (le client envoie par date de création).
        return Flux.fromIterable(request.getOperations())
                .concatMap(op -> processOne(userId, op));
    }

    private Mono<SyncOperationResult> processOne(UUID userId, SyncBatchRequest.Operation op) {
        if (op.getOpId() == null) {
            return Mono.just(SyncOperationResult.of(null, "INVALID", "opId manquant"));
        }
        return syncOperationRepository.findById(op.getOpId())
                // Rejeu : on retourne le verdict mémorisé, sans ré-exécution.
                .map(existing -> SyncOperationResult.of(op.getOpId(), "ALREADY_PROCESSED",
                        existing.getResultStatus() + (existing.getResultMessage() != null
                                ? " : " + existing.getResultMessage() : "")))
                .switchIfEmpty(Mono.defer(() -> execute(userId, op)
                        .flatMap(result -> record(userId, op, result))));
    }

    /** Mémorise le verdict (sauf erreur transitoire, qui doit rester rejouable). */
    private Mono<SyncOperationResult> record(UUID userId, SyncBatchRequest.Operation op,
            SyncOperationResult result) {
        if ("TEMPORARY_ERROR".equals(result.getStatus())) {
            return Mono.just(result);
        }
        return syncOperationRepository.save(SyncOperation.builder()
                .id(op.getOpId())
                .userId(userId)
                .opType(op.getType())
                .resultStatus(result.getStatus())
                .resultMessage(result.getMessage())
                .createdAt(LocalDateTime.now())
                .build())
                .thenReturn(result)
                // Insert concurrent du même opId : l'autre requête a gagné, c'est un rejeu.
                .onErrorReturn(SyncOperationResult.of(op.getOpId(), "ALREADY_PROCESSED",
                        "Traitée par une synchronisation concurrente"));
    }

    private Mono<SyncOperationResult> execute(UUID userId, SyncBatchRequest.Operation op) {
        try {
            switch (op.getType() == null ? "" : op.getType()) {
                case OP_SESSION_COMPLETE:
                    return executeSessionComplete(userId, op);
                case OP_VEHICLE_POSITION:
                    return executeVehiclePosition(userId, op);
                default:
                    return Mono.just(SyncOperationResult.of(op.getOpId(), "INVALID",
                            "Type d'opération inconnu : " + op.getType()));
            }
        } catch (Exception e) {
            return Mono.just(SyncOperationResult.of(op.getOpId(), "INVALID", e.getMessage()));
        }
    }

    /**
     * Validation de séance saisie hors ligne. Détection de conflit : si la
     * séance n'est plus dans l'état que le client connaissait (baseStatus) —
     * par exemple annulée ou déjà complétée par le gérant — on signale un
     * CONFLICT au lieu d'écraser (pas de « dernière écriture gagnante »).
     */
    private Mono<SyncOperationResult> executeSessionComplete(UUID userId, SyncBatchRequest.Operation op) {
        UUID sessionId = op.uuid("sessionId");
        if (sessionId == null) {
            return Mono.just(SyncOperationResult.of(op.getOpId(), "INVALID", "sessionId manquant"));
        }
        String notes = op.str("notes");
        String baseStatus = op.str("baseStatus");
        return sessionRepository.findById(sessionId)
                .flatMap(session -> {
                    if (session.getStatus() == Session.SessionStatus.COMPLETED) {
                        return Mono.just(SyncOperationResult.of(op.getOpId(), "CONFLICT",
                                "Séance déjà validée côté serveur — vérifiez les notes pédagogiques"));
                    }
                    if (baseStatus != null && !baseStatus.equals(session.getStatus().name())) {
                        return Mono.just(SyncOperationResult.of(op.getOpId(), "CONFLICT",
                                "Séance modifiée entre-temps (état serveur : "
                                        + session.getStatus().name() + ")"));
                    }
                    return sessionService.completeSessionByMonitor(userId, sessionId, notes)
                            .map(dto -> SyncOperationResult.of(op.getOpId(), "SYNCED", null));
                })
                .switchIfEmpty(Mono.just(SyncOperationResult.of(op.getOpId(), "INVALID",
                        "Séance introuvable")))
                .onErrorResume(e -> Mono.just(classify(op.getOpId(), e)));
    }

    /**
     * Position GPS mémorisée hors ligne : ajout à l'historique (append-only,
     * jamais de conflit) ; la garde métier (séance de conduite active) est
     * revalidée par VehicleService au moment de la synchronisation.
     */
    private Mono<SyncOperationResult> executeVehiclePosition(UUID userId, SyncBatchRequest.Operation op) {
        UUID vehicleId = op.uuid("vehicleId");
        Double lat = op.dbl("latitude");
        Double lon = op.dbl("longitude");
        if (vehicleId == null || lat == null || lon == null) {
            return Mono.just(SyncOperationResult.of(op.getOpId(), "INVALID",
                    "vehicleId/latitude/longitude requis"));
        }
        return vehicleService.updatePosition(vehicleId, lat, lon, userId)
                .map(dto -> SyncOperationResult.of(op.getOpId(), "SYNCED", null))
                .onErrorResume(e -> Mono.just(classify(op.getOpId(), e)));
    }

    /** Distingue erreur métier définitive (INVALID) et panne transitoire. */
    private SyncOperationResult classify(UUID opId, Throwable e) {
        if (e instanceof ResponseStatusException rse) {
            int code = rse.getStatusCode().value();
            if (code >= 400 && code < 500) {
                return SyncOperationResult.of(opId, "INVALID", rse.getReason());
            }
            return SyncOperationResult.of(opId, "TEMPORARY_ERROR", "Service indisponible");
        }
        if (e instanceof RuntimeException && e.getMessage() != null
                && !e.getMessage().toLowerCase().contains("connection")) {
            // Erreurs métier des services existants (RuntimeException à message).
            return SyncOperationResult.of(opId, "INVALID", e.getMessage());
        }
        log.warn("Erreur transitoire de synchronisation : {}", e.toString());
        return SyncOperationResult.of(opId, "TEMPORARY_ERROR", "Erreur temporaire, réessayez");
    }
}
