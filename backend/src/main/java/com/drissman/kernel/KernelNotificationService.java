package com.drissman.kernel;

import com.drissman.domain.entity.Invoice;
import com.drissman.domain.entity.Offer;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.HashMap;
import java.util.Map;

/**
 * Notifications natives via le module Notifications du kernel (09-files-notifications).
 *
 * Remplace/complète les toasts locaux du frontend par des notifications
 * réellement adressées au destinataire (email par défaut ; SMS/WhatsApp/push
 * activables via configuration côté kernel une fois les providers provisionnés).
 *
 * Contrat (POST /api/notifications/deliveries) :
 *   { recipientUserId?, recipientAddress?, channel(REQUIS : EMAIL|SMS|WHATSAPP|PUSH|WEBSOCKET),
 *     templateCode?, subject?, body(REQUIS), variables?, metadata? }
 *
 * Best-effort : l'envoi s'exécute en arrière-plan et n'impacte JAMAIS le flux
 * local (paiement, inscription…). Toute indisponibilité est loguée KERNEL_MIRROR
 * (op=notification.send outcome=OK|SKIP|FAIL) sans remonter à l'appelant.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelNotificationService {

    private final KernelClient kernelClient;
    private final UserRepository userRepository;

    @Value("${kernel.notification.enabled:true}")
    private boolean enabled;

    /** Canal par défaut ; EMAIL est le plus fiable (le provider est natif côté kernel). */
    @Value("${kernel.notification.channel:EMAIL}")
    private String defaultChannel;

    // ----- Points d'accroche métier (fire-and-forget) -----------------------

    /** Paiement confirmé : prévient le candidat que son inscription est active. */
    public void notifyPaymentConfirmedInBackground(Invoice invoice) {
        if (invoice == null || invoice.getUserId() == null) {
            return;
        }
        userRepository.findById(invoice.getUserId())
                .flatMap(user -> send(user,
                        "Paiement confirmé — inscription activée",
                        "Votre paiement (référence " + invoice.getPaymentReference()
                                + ") a bien été reçu. Votre inscription est désormais active. "
                                + "Vous pouvez commencer votre formation.",
                        Map.of("event", "payment.confirmed",
                                "reference", nullToEmpty(invoice.getPaymentReference()))))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(v -> {}, e -> { /* déjà logué KERNEL_MIRROR */ });
    }

    /** Nouvelle inscription : accuse réception au candidat (en attente de paiement/validation). */
    public void notifyEnrollmentCreatedInBackground(User student, Offer offer) {
        if (student == null) {
            return;
        }
        String offerName = offer != null && offer.getName() != null ? offer.getName() : "votre formation";
        send(student,
                "Inscription enregistrée",
                "Votre inscription à l'offre « " + offerName + " » a bien été enregistrée. "
                        + "Elle sera active dès la confirmation du paiement.",
                Map.of("event", "enrollment.created"))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(v -> {}, e -> { /* déjà logué KERNEL_MIRROR */ });
    }

    // ----- Envoi générique --------------------------------------------------

    /**
     * Envoie une notification à un utilisateur Drissman. Ne bloque ni n'échoue
     * jamais l'appelant : le Mono renvoyé se termine à vide en cas de souci.
     */
    public Mono<Void> send(User recipient, String subject, String body, Map<String, String> variables) {
        if (!enabled) {
            KernelMirrorLog.skip("notification.send", subject, "notifications désactivées");
            return Mono.empty();
        }
        if (recipient == null) {
            return Mono.empty();
        }
        boolean hasKernelUser = recipient.getKernelUserId() != null;
        boolean hasEmail = recipient.getEmail() != null && !recipient.getEmail().isBlank();
        if (!hasKernelUser && !hasEmail) {
            KernelMirrorLog.skip("notification.send", recipient.getId(),
                    "destinataire sans kernelUserId ni email");
            return Mono.empty();
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("channel", defaultChannel);
        payload.put("body", body);
        if (subject != null && !subject.isBlank()) payload.put("subject", subject);
        if (hasKernelUser) payload.put("recipientUserId", recipient.getKernelUserId().toString());
        if (hasEmail) payload.put("recipientAddress", recipient.getEmail());
        if (variables != null && !variables.isEmpty()) payload.put("variables", variables);
        payload.put("metadata", Map.of("source", "drissman"));

        Object ref = recipient.getId();
        return kernelClient.post("/api/notifications/deliveries", payload)
                .doOnNext(r -> KernelMirrorLog.ok("notification.send", ref,
                        "channel=" + defaultChannel + " status="
                                + (r.getData() != null ? r.getData().path("status").asText("?") : "?")))
                .doOnError(e -> KernelMirrorLog.fail("notification.send", ref, e, errorBody(e)))
                .onErrorResume(e -> Mono.empty())
                .then();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    /** Corps de la réponse d'erreur kernel (porte la vraie cause), tronqué. */
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
