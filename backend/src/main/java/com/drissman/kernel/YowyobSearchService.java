package com.drissman.kernel;

import com.drissman.domain.entity.School;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.HashMap;
import java.util.Map;

/**
 * Indexation des auto-écoles dans yowyob-search (recherche globale de la plateforme).
 *
 * Contrat (https://search.yowyob.com/v3/api-docs) :
 *   PUT    /api/index/{collection}/{id}   -> indexe/met à jour un document
 *   DELETE /api/index/{collection}/{id}   -> retire un document
 * Authentification : MÊMES en-têtes machine que kernel-core
 * (X-Client-Id, X-Api-Key, X-Tenant-Id) — aucune nouvelle credential requise.
 *
 * NB : contrairement aux modules org-scopés (compta, HRM, document-hub),
 * l'indexation ne dépend PAS de l'organisation : elle fonctionne dès maintenant.
 *
 * Best-effort : exécuté en arrière-plan, jamais bloquant, tracé KERNEL_MIRROR.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class YowyobSearchService {

    /** Collection de recherche des auto-écoles Drissman. */
    public static final String COLLECTION_SCHOOL = "driving_school";

    @Value("${search.base-url:https://search.yowyob.com}")
    private String searchBaseUrl;

    @Value("${search.enabled:true}")
    private boolean enabled;

    @Value("${kernel.client-id:}")
    private String clientId;

    @Value("${kernel.api-key:}")
    private String apiKey;

    @Value("${kernel.tenant-id:}")
    private String tenantId;

    @Value("${app.public-base-url:https://drisman.yowyob.com}")
    private String publicBaseUrl;

    /** Indexe (ou réindexe) une auto-école, sans bloquer le flux appelant. */
    public void indexSchoolInBackground(School school) {
        indexSchool(school)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(v -> {}, e -> { /* déjà logué KERNEL_MIRROR */ });
    }

    /** Retire une auto-école de l'index, sans bloquer le flux appelant. */
    public void removeSchoolInBackground(java.util.UUID schoolId) {
        if (schoolId == null || !isConfigured()) {
            return;
        }
        client().delete()
                .uri("/api/index/{collection}/{id}", COLLECTION_SCHOOL, schoolId.toString())
                .retrieve()
                .bodyToMono(String.class)
                .doOnNext(r -> KernelMirrorLog.ok("search.remove", schoolId, "collection=" + COLLECTION_SCHOOL))
                .doOnError(e -> KernelMirrorLog.fail("search.remove", schoolId, e, errorBody(e)))
                .onErrorResume(e -> Mono.empty())
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(v -> {}, e -> {});
    }

    /**
     * DIAGNOSTIC : interroge yowyob-search avec NOS identifiants et NOTRE tenant.
     *
     * Permet de savoir si nos documents sont réellement présents dans l'index,
     * indépendamment de ce qu'affiche l'interface publique du moteur (qui peut
     * filtrer par tenant et ne surfacer que certaines collections).
     */
    public Mono<String> searchRaw(String q, String collection) {
        if (!isConfigured()) {
            return Mono.just("{\"error\":\"identifiants machine kernel absents\"}");
        }
        return client().get()
                .uri(uriBuilder -> {
                    uriBuilder.path("/api/search").queryParam("q", q == null || q.isBlank() ? "*" : q);
                    if (collection != null && !collection.isBlank()) {
                        uriBuilder.queryParam("collection", collection);
                    }
                    return uriBuilder.build();
                })
                .retrieve()
                .bodyToMono(String.class)
                .onErrorResume(e -> Mono.just("{\"error\":\"" + safe(e.getMessage()) + "\",\"body\":\""
                        + safe(errorBody(e)) + "\"}"));
    }

    private static String safe(String s) {
        return s == null ? "" : s.replace("\"", "'").replace("\n", " ");
    }

    Mono<Void> indexSchool(School school) {
        if (school == null || school.getId() == null) {
            return Mono.empty();
        }
        if (!enabled) {
            KernelMirrorLog.skip("search.index", school.getId(), "indexation désactivée (search.enabled=false)");
            return Mono.empty();
        }
        if (!isConfigured()) {
            KernelMirrorLog.skip("search.index", school.getId(), "identifiants machine kernel absents");
            return Mono.empty();
        }

        return client().put()
                .uri("/api/index/{collection}/{id}", COLLECTION_SCHOOL, school.getId().toString())
                .bodyValue(toDocument(school))
                .retrieve()
                .bodyToMono(String.class)
                .doOnNext(r -> KernelMirrorLog.ok("search.index", school.getId(),
                        "collection=" + COLLECTION_SCHOOL + " name=" + school.getName()))
                .doOnError(e -> KernelMirrorLog.fail("search.index", school.getId(), e, errorBody(e)))
                .onErrorResume(e -> Mono.empty())
                .then();
    }

    /**
     * Document indexé : uniquement des informations PUBLIQUES de l'auto-école
     * (celles déjà visibles sur la fiche publique). Aucune donnée sensible.
     */
    private Map<String, Object> toDocument(School school) {
        Map<String, Object> doc = new HashMap<>();
        doc.put("name", school.getName());
        putIfPresent(doc, "description", school.getDescription());
        putIfPresent(doc, "address", school.getAddress());
        putIfPresent(doc, "city", school.getCity());
        putIfPresent(doc, "region", school.getRegion());
        putIfPresent(doc, "phone", school.getPhone());
        putIfPresent(doc, "email", school.getEmail());
        putIfPresent(doc, "website", school.getWebsite());
        if (school.getLatitude() != null) doc.put("latitude", school.getLatitude());
        if (school.getLongitude() != null) doc.put("longitude", school.getLongitude());
        if (school.getRating() != null) doc.put("rating", school.getRating());
        doc.put("verified", Boolean.TRUE.equals(school.getIsVerified()));
        doc.put("category", "Auto-école");
        doc.put("source", "drissman");
        // Lien de retour vers la fiche publique Drissman.
        doc.put("url", publicBaseUrl + "/school/" + school.getId());
        return doc;
    }

    private static void putIfPresent(Map<String, Object> doc, String key, String value) {
        if (value != null && !value.isBlank()) {
            doc.put(key, value);
        }
    }

    private boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && tenantId != null && !tenantId.isBlank();
    }

    private WebClient client() {
        return WebClient.builder()
                .baseUrl(searchBaseUrl)
                .defaultHeader("X-Client-Id", clientId)
                .defaultHeader("X-Api-Key", apiKey)
                .defaultHeader("X-Tenant-Id", tenantId)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
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
