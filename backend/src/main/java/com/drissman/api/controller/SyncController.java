package com.drissman.api.controller;

import com.drissman.api.dto.SyncBatchRequest;
import com.drissman.api.dto.SyncOperationResult;
import com.drissman.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;

import java.security.Principal;
import java.util.UUID;

/**
 * Point d'entrée de synchronisation du mode hors ligne. Authentifié : un JWT
 * valide est exigé — si la session locale a expiré pendant la période hors
 * ligne, le client reçoit 401 et doit se ré-authentifier avant de synchroniser.
 */
@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    @PostMapping("/batch")
    public Flux<SyncOperationResult> batch(Principal principal, @RequestBody SyncBatchRequest request) {
        if (principal == null) {
            return Flux.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentification requise"));
        }
        return syncService.processBatch(UUID.fromString(principal.getName()), request);
    }
}
