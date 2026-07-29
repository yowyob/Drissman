package com.drissman.kernel;

import com.drissman.domain.entity.Invoice;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.SchoolRepository;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Reflet des encaissements Drissman vers l'accounting-core / cashier-core du
 * kernel (bill lié à l'organisation de l'école puis paiement).
 *
 * Best-effort : exécuté en arrière-plan avec le token-miroir de l'admin de
 * l'école, scopé à l'organisation de l'école (jamais au tenant partagé). Toute
 * indisponibilité (école non provisionnée, miroir non vérifié, endpoint kernel
 * non confirmé) est loguée sans jamais impacter la confirmation locale du
 * paiement — la facture Drissman reste la source de vérité.
 *
 * Chaîne visée (à confirmer côté équipe kernel) :
 *   POST /api/organizations/{orgId}/bills            -> crée le bill (id)
 *   POST /api/bills/{billId}/pay                      -> enregistre l'encaissement
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelAccountingService {

    private final KernelClient kernelClient;
    private final KernelAuthService kernelAuthService;
    private final SchoolRepository schoolRepository;
    private final UserRepository userRepository;

    /** Reflète une facture PAID vers le cashier-core, sans bloquer le flux local. */
    public void reflectPaidInvoiceInBackground(Invoice invoice) {
        reflectPaidInvoice(invoice)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        v -> {
                        },
                        e -> log.info("Reflet cashier-core de la facture {} indisponible : {}",
                                invoice.getPaymentReference(), e.getMessage()));
    }

    Mono<Void> reflectPaidInvoice(Invoice invoice) {
        if (invoice.getSchoolId() == null || invoice.getStatus() != Invoice.InvoiceStatus.PAID) {
            return Mono.empty();
        }
        return schoolContext(invoice.getSchoolId())
                .flatMap(ctx -> {
                    UUID orgId = ctx.getT1();
                    Map<String, String> headers = KernelClient.bearerWithOrganization(ctx.getT2(), orgId.toString());

                    Map<String, Object> bill = new HashMap<>();
                    bill.put("reference", invoice.getPaymentReference());
                    bill.put("amount", invoice.getAmount());
                    bill.put("currency", "XAF");
                    bill.put("description", "Inscription auto-école Drissman " + invoice.getPaymentReference());

                    return kernelClient.post("/api/organizations/" + orgId + "/bills", bill, headers)
                            .flatMap(created -> {
                                String billId = created.getData() != null
                                        ? created.getData().path("id").asText(null)
                                        : null;
                                if (billId == null) {
                                    return Mono.empty();
                                }
                                Map<String, Object> payment = new HashMap<>();
                                payment.put("amount", invoice.getAmount());
                                payment.put("method", invoice.getPaymentMethod() != null
                                        ? invoice.getPaymentMethod().name()
                                        : "CASH");
                                return kernelClient.post("/api/bills/" + billId + "/pay", payment, headers)
                                        .doOnNext(r -> log.info(
                                                "Encaissement {} reflété dans cashier-core (bill {})",
                                                invoice.getPaymentReference(), billId));
                            });
                })
                .then();
    }

    /**
     * Contexte kernel d'une école : (organizationId, token admin).
     * Vide si l'école n'est pas provisionnée ou si aucun token n'est possible.
     */
    private Mono<Tuple2<UUID, String>> schoolContext(UUID schoolId) {
        return schoolRepository.findById(schoolId)
                .filter(school -> school.getKernelOrganizationId() != null)
                .flatMap(school -> userRepository
                        .findFirstBySchoolIdAndRole(schoolId, User.Role.SCHOOL_ADMIN)
                        .flatMap(kernelAuthService::ensureToken)
                        .map(token -> Tuples.of(school.getKernelOrganizationId(), token)));
    }
}
