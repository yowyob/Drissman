package com.drissman.kernel;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Client HTTP vers le kernel-core (plateforme yowyob).
 *
 * Injecte automatiquement l'identité machine (X-Client-Id, X-Api-Key,
 * X-Tenant-Id) sur chaque appel — contrat serveur-vers-serveur :
 * le frontend ne doit JAMAIS appeler le kernel directement.
 *
 * En-têtes additionnels par requête (Authorization Bearer,
 * X-Organization-Id) via le paramètre extraHeaders.
 */
@Component
public class KernelClient {

    private final WebClient webClient;

    public KernelClient(
            WebClient.Builder builder,
            @Value("${kernel.base-url}") String baseUrl,
            @Value("${kernel.client-id}") String clientId,
            @Value("${kernel.api-key}") String apiKey,
            @Value("${kernel.tenant-id}") String tenantId) {
        this.webClient = builder
                .baseUrl(baseUrl)
                .defaultHeader("X-Client-Id", clientId)
                .defaultHeader("X-Api-Key", apiKey)
                .defaultHeader("X-Tenant-Id", tenantId)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public Mono<KernelResponse> get(String path) {
        return get(path, Map.of());
    }

    public Mono<KernelResponse> get(String path, Map<String, String> extraHeaders) {
        return webClient.get()
                .uri(path)
                .headers(h -> extraHeaders.forEach(h::set))
                .retrieve()
                .bodyToMono(KernelResponse.class);
    }

    public Mono<KernelResponse> post(String path, Object body) {
        return post(path, body, Map.of());
    }

    public Mono<KernelResponse> post(String path, Object body, Map<String, String> extraHeaders) {
        return webClient.post()
                .uri(path)
                .headers(h -> extraHeaders.forEach(h::set))
                .bodyValue(body)
                .retrieve()
                .bodyToMono(KernelResponse.class);
    }

    /** En-tête Authorization Bearer pour les endpoints protégés du kernel. */
    public static Map<String, String> bearer(String accessToken) {
        return Map.of(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
    }

    /** En-têtes pour les opérations scopées organisation. */
    public static Map<String, String> bearerWithOrganization(String accessToken, String organizationId) {
        return Map.of(
                HttpHeaders.AUTHORIZATION, "Bearer " + accessToken,
                "X-Organization-Id", organizationId);
    }
}
