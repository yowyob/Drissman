package com.drissman.kernel;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Service pour interagir avec la Payment Gateway intégrée du Kernel Core.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelPaymentGatewayClient {

    private final KernelClient kernelClient;

    /**
     * Initie un paiement (Stripe ou Mobile Money) via le Kernel.
     */
    public Mono<JsonNode> initiatePayment(String idempotencyKey, long amount, String provider, String method, String payerReference, String description) {
        Map<String, Object> request = new HashMap<>();
        request.put("idempotencyKey", idempotencyKey);
        request.put("amount", amount);
        request.put("currency", "XAF"); // Par défaut
        request.put("provider", provider);
        request.put("method", method);
        
        if (payerReference != null && !payerReference.isBlank()) {
            request.put("payerReference", payerReference);
        }
        if (description != null && !description.isBlank()) {
            request.put("description", description);
        }

        return kernelClient.post("/api/payments/orders", request)
                .map(KernelResponse::getData)
                .doOnNext(data -> log.debug("Initiate Payment response: {}", data));
    }

    /**
     * Récupère le statut d'une commande de paiement.
     */
    public Mono<JsonNode> getPaymentOrder(String id) {
        return kernelClient.get("/api/payments/orders/" + id)
                .map(KernelResponse::getData);
    }
}
