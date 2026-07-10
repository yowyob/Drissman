package com.drissman.api.controller;

import com.drissman.api.dto.InitiatePaymentRequest;
import com.drissman.api.dto.PaymentDto;
import com.drissman.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<PaymentDto> initiate(Principal principal, @Valid @RequestBody InitiatePaymentRequest request) {
        return requireUser(principal)
                .flatMap(userId -> paymentService.initiate(userId, request));
    }

    @GetMapping("/me")
    public Flux<PaymentDto> myPayments(Principal principal) {
        return requireUser(principal)
                .flatMapMany(paymentService::getPaymentsForUser);
    }

    /**
     * Callback du prestataire (Stripe via Yowyob Payment). Non authentifié :
     * confirme la facture d'après la référence provider, en complément du
     * polling /refresh côté candidat. Idempotent.
     */
    @PostMapping("/webhook")
    @ResponseStatus(HttpStatus.OK)
    public Mono<Void> webhook(@RequestBody java.util.Map<String, Object> payload) {
        Object ref = payload.getOrDefault("reference", payload.get("providerReference"));
        Object status = payload.getOrDefault("status", payload.get("state"));
        return paymentService.handleProviderWebhook(
                ref != null ? ref.toString() : null,
                status != null ? status.toString() : null);
    }

    /** Interroge le prestataire (paiement carte) et met le statut à jour. */
    @GetMapping("/{invoiceId}/refresh")
    public Mono<PaymentDto> refresh(Principal principal, @PathVariable UUID invoiceId) {
        return requireUser(principal)
                .flatMap(userId -> paymentService.refresh(userId, invoiceId));
    }

    private Mono<UUID> requireUser(Principal principal) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }
        return Mono.just(UUID.fromString(principal.getName()));
    }
}
