package com.drissman.kernel;

import com.drissman.domain.entity.School;
import com.drissman.domain.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Intégration KYC / Document-hub du kernel pour les pièces d'auto-école.
 *
 * Flux (best-effort, jamais bloquant) :
 *   1. archive du fichier dans le file-core        -> POST /api/files (fileId)
 *   2. rattachement au Document-hub                -> POST /api/document-hub/links (documentLinkId)
 *      { documentCategory, fileId, targetId=<orgId>, targetType="ORGANIZATION", label }
 *   3. (super-admin) revue d'une pièce             -> POST /api/document-governance/documents/{id}/reviews
 *
 * La cible est l'organisation kernel de l'école (targetType ORGANIZATION).
 * Toute indisponibilité (école non provisionnée, module non actif…) est loguée
 * KERNEL_MIRROR sans impacter le stockage/statut local.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelDocumentService {

    private final KernelClient kernelClient;
    private final KernelFileService kernelFileService;
    private final KernelAuthService kernelAuthService;
    private final KernelOrganization kernelOrganization;

    public static final String TARGET_TYPE = "ORGANIZATION";

    /** Références kernel d'une pièce miroitée (null si non abouti). */
    public record DocumentRef(UUID kernelFileId, UUID documentLinkId) {}

    /**
     * Archive le fichier puis le rattache au Document-hub de l'organisation de
     * l'école. Renvoie les références kernel, ou Mono.empty() en best-effort.
     */
    public Mono<DocumentRef> archiveAndAttach(User schoolAdmin, School school, byte[] bytes,
                                              String filename, String contentType, String category) {
        // MODÈLE A : la cible est l'organisation UNIQUE de Drissman, pas une org
        // par école (les écoles ne sont pas des organisations kernel).
        UUID orgId = kernelOrganization.id().orElse(null);
        Object ref = school != null ? school.getId() : null;
        if (orgId == null) {
            KernelMirrorLog.skip("document.attach", ref,
                    "KERNEL_ORGANIZATION_ID non configuré (organisation Drissman)");
            return Mono.empty();
        }

        return kernelAuthService.ensureToken(schoolAdmin)
                .flatMap(token -> kernelFileService.archive(schoolAdmin, bytes, filename, contentType, category)
                        .filter(fileId -> fileId != null && !fileId.isBlank())
                        .flatMap(fileId -> {
                            Map<String, Object> body = new HashMap<>();
                            body.put("documentCategory", category);
                            body.put("fileId", fileId);
                            body.put("targetId", orgId.toString());
                            body.put("targetType", TARGET_TYPE);
                            // Toutes les écoles partageant l'organisation Drissman, le libellé
                            // porte le nom de l'école pour rester traçable côté kernel.
                            String schoolName = school != null && school.getName() != null ? school.getName() : null;
                            String label = schoolName != null
                                    ? schoolName + " — " + (filename != null ? filename : category)
                                    : filename;
                            if (label != null) body.put("label", label);

                            Map<String, String> headers = KernelClient.bearerWithOrganization(token, orgId.toString());
                            return kernelClient.post("/api/document-hub/links", body, headers)
                                    .map(resp -> {
                                        UUID linkId = extractUuid(resp, "id");
                                        KernelMirrorLog.ok("document.attach", ref,
                                                "category=" + category + " fileId=" + fileId + " linkId=" + linkId);
                                        return new DocumentRef(toUuid(fileId), linkId);
                                    });
                        }))
                .doOnError(e -> KernelMirrorLog.fail("document.attach", ref, e, errorBody(e)))
                .onErrorResume(e -> Mono.empty());
    }

    /**
     * Revue d'une pièce par le super-admin (approbation/rejet), miroitée au
     * document-governance du kernel. Best-effort en arrière-plan.
     */
    public Mono<Void> review(User reviewer, UUID documentLinkId, String reviewStatus, String notes) {
        if (documentLinkId == null) {
            return Mono.empty();
        }
        Map<String, Object> body = new HashMap<>();
        body.put("reviewStatus", reviewStatus);
        if (notes != null && !notes.isBlank()) body.put("notes", notes);

        Object ref = documentLinkId;
        return kernelAuthService.ensureToken(reviewer)
                .flatMap(token -> kernelClient.post(
                        "/api/document-governance/documents/" + documentLinkId + "/reviews",
                        body, KernelClient.bearer(token)))
                .doOnNext(r -> KernelMirrorLog.ok("document.review", ref, "status=" + reviewStatus))
                .doOnError(e -> KernelMirrorLog.fail("document.review", ref, e, errorBody(e)))
                .onErrorResume(e -> Mono.empty())
                .then();
    }

    private static UUID extractUuid(KernelResponse resp, String field) {
        if (resp == null || resp.getData() == null) return null;
        String v = resp.getData().path(field).asText(null);
        return toUuid(v);
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
