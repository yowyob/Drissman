package com.drissman.kernel;

import com.drissman.domain.entity.School;
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
 * Miroir des décisions de gouvernance Drissman vers le module Governance du
 * kernel (03-identity-governance).
 *
 * La décision d'un super-admin Drissman (approuver / rejeter une auto-école)
 * reste la source de vérité LOCALE (colonne schools.governance_status), mais
 * elle est propagée au kernel comme décision officielle :
 *   POST /api/administration/governance/organizations/{orgId}   { action, reason }
 *   POST /api/administration/governance/business-actors/{baId}  { action, reason }
 *
 * Remplace le self-assign (403) : ce n'est plus l'école qui s'auto-déclare,
 * c'est l'administration qui statue, et le kernel enregistre le governanceStatus.
 *
 * Best-effort : exécuté en arrière-plan ; toute indisponibilité (école non
 * provisionnée, action non reconnue…) est loguée KERNEL_MIRROR sans jamais
 * impacter la décision locale.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelGovernanceService {

    private final KernelClient kernelClient;

    /** Actions kernel non figées en enum côté contrat : configurables. */
    @Value("${kernel.governance.approve-action:APPROVE}")
    private String approveAction;

    @Value("${kernel.governance.reject-action:REJECT}")
    private String rejectAction;

    /** Reflète une APPROBATION d'école, sans bloquer le flux local. */
    public void mirrorApprovalInBackground(School school, String reason) {
        mirror(school, approveAction, reason)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(v -> {}, e -> { /* déjà logué KERNEL_MIRROR */ });
    }

    /** Reflète un REJET d'école, sans bloquer le flux local. */
    public void mirrorRejectionInBackground(School school, String reason) {
        mirror(school, rejectAction, reason)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(v -> {}, e -> { /* déjà logué KERNEL_MIRROR */ });
    }

    /**
     * Poste la décision sur l'organisation ET, si connu, sur le business actor.
     * Vide (skip) si l'école n'est pas provisionnée côté kernel.
     */
    Mono<Void> mirror(School school, String action, String reason) {
        if (school == null || school.getKernelOrganizationId() == null) {
            KernelMirrorLog.skip("governance.decision",
                    school != null ? school.getId() : null,
                    "école non provisionnée (kernelOrganizationId absent)");
            return Mono.empty();
        }
        Map<String, Object> body = new HashMap<>();
        body.put("action", action);
        if (reason != null && !reason.isBlank()) body.put("reason", reason);

        Object ref = school.getId();
        String orgPath = "/api/administration/governance/organizations/" + school.getKernelOrganizationId();
        Mono<Void> orgCall = kernelClient.post(orgPath, body)
                .doOnNext(r -> KernelMirrorLog.ok("governance.organization", ref, "action=" + action))
                .doOnError(e -> KernelMirrorLog.fail("governance.organization", ref, e, errorBody(e)))
                .onErrorResume(e -> Mono.empty())
                .then();

        Mono<Void> baCall = Mono.empty();
        if (school.getKernelBusinessActorId() != null) {
            String baPath = "/api/administration/governance/business-actors/" + school.getKernelBusinessActorId();
            baCall = kernelClient.post(baPath, body)
                    .doOnNext(r -> KernelMirrorLog.ok("governance.business-actor", ref, "action=" + action))
                    .doOnError(e -> KernelMirrorLog.fail("governance.business-actor", ref, e, errorBody(e)))
                    .onErrorResume(e -> Mono.empty())
                    .then();
        }
        return orgCall.then(baCall);
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
