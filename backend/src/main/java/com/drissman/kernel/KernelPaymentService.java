package com.drissman.kernel;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Intégration du Payment Core du kernel (module 12-payment-plan).
 *
 * Permet un encaissement RÉEL :
 *   - Mobile Money via MyCoolPay (MTN / Orange Money au Cameroun),
 *   - Carte via Stripe.
 *
 * Contrat (POST /api/payments/orders) :
 *   { clientId, serviceCode, idempotencyKey, amount, currency,
 *     provider: MYCOOLPAY|STRIPE, method: MOBILE_MONEY|CARD,
 *     payerReference, description, callbackUrl }
 *   -> { id, status, providerReference, redirectUrl, ... }
 *
 * Best-effort : si le kernel est indisponible ou non configuré, l'appelant
 * retombe sur le flux local (facture PENDING confirmée par l'école).
 */
@Service
@RequiredArgsConstructor
public class KernelPaymentService {

    private final KernelClient kernelClient;

    @Value("${kernel.client-id:}")
    private String clientId;

    @Value("${kernel.payment.service-code:PAYMENT}")
    private String serviceCode;

    @Value("${kernel.payment.currency:XAF}")
    private String currency;

    /** URL publique que le kernel appellera pour notifier le statut final (webhook). */
    @Value("${kernel.payment.callback-url:}")
    private String callbackUrl;

    /** Résultat normalisé d'un ordre de paiement kernel. */
    public record PaymentOrder(String id, String status, String providerReference, String redirectUrl) {
        public boolean isEmpty() {
            return id == null && status == null && providerReference == null;
        }
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank();
    }

    /** Ordre Mobile Money (MyCoolPay) : le payeur reçoit une demande de paiement (push USSD). */
    public Mono<PaymentOrder> createMobileMoneyOrder(long amount, String payerPhone, String description, String idempotencyKey) {
        return createOrder("MYCOOLPAY", "MOBILE_MONEY", amount, payerPhone, description, idempotencyKey);
    }

    /** Ordre carte (Stripe) : renvoie une redirectUrl de checkout. */
    public Mono<PaymentOrder> createCardOrder(long amount, String payerReference, String description, String idempotencyKey) {
        return createOrder("STRIPE", "CARD", amount, payerReference, description, idempotencyKey);
    }

    private Mono<PaymentOrder> createOrder(String provider, String method, long amount, String payerReference,
                                           String description, String idempotencyKey) {
        Map<String, Object> body = new HashMap<>();
        body.put("clientId", clientId);
        body.put("serviceCode", serviceCode);
        body.put("idempotencyKey", idempotencyKey);
        body.put("amount", amount);
        body.put("currency", currency);
        body.put("provider", provider);
        body.put("method", method);
        if (payerReference != null && !payerReference.isBlank()) body.put("payerReference", payerReference);
        if (description != null && !description.isBlank()) body.put("description", description);
        if (callbackUrl != null && !callbackUrl.isBlank()) body.put("callbackUrl", callbackUrl);
        return kernelClient.post("/api/payments/orders", body).map(this::toOrder);
    }

    /** Rafraîchit le statut de l'ordre auprès du provider. */
    public Mono<PaymentOrder> refreshOrder(String orderId) {
        return kernelClient.post("/api/payments/orders/" + orderId + "/refresh", Map.of()).map(this::toOrder);
    }

    /** Le PaymentOrderResponse peut être encapsulé dans `data` (ApiResponse) ou à la racine. */
    private PaymentOrder toOrder(KernelResponse resp) {
        JsonNode d = resp.getData();
        if (d == null || d.isMissingNode() || d.isNull()) {
            return new PaymentOrder(null, null, null, null);
        }
        return new PaymentOrder(
                text(d, "id"),
                text(d, "status"),
                text(d, "providerReference"),
                text(d, "redirectUrl"));
    }

    private static String text(JsonNode n, String field) {
        JsonNode v = n.path(field);
        return v.isMissingNode() || v.isNull() ? null : v.asText(null);
    }
}
