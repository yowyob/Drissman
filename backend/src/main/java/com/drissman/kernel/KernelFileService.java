package com.drissman.kernel;

import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.UUID;

/**
 * Archivage des fichiers Drissman dans le file-core du kernel (DS-F-01).
 *
 * Stratégie hybride : l'image est servie depuis le stockage local Drissman
 * (rapide, public), et archivée en parallèle dans le kernel comme système
 * de référence documentaire. Best-effort : une panne kernel n'empêche
 * jamais l'upload local de réussir.
 *
 * Validé en prod : POST /api/files (multipart `file`) → data.id ;
 * relecture binaire via GET /api/files/{fileId}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KernelFileService {

    private final KernelAuthService kernelAuthService;
    private final UserRepository userRepository;

    @Value("${kernel.base-url}")
    private String kernelBaseUrl;

    @Value("${kernel.client-id}")
    private String clientId;

    @Value("${kernel.api-key}")
    private String apiKey;

    @Value("${kernel.tenant-id}")
    private String tenantId;

    /** Archive le fichier dans le kernel au nom de l'utilisateur (miroir). */
    public void archiveInBackground(UUID uploaderUserId, byte[] bytes, String filename,
            String contentType, String documentType) {
        userRepository.findById(uploaderUserId)
                .flatMap(user -> archive(user, bytes, filename, contentType, documentType))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        fileId -> log.info("Fichier {} archivé dans le file-core kernel : {}", filename, fileId),
                        e -> log.info("Archivage kernel indisponible pour {} : {}", filename, e.getMessage()));
    }

    Mono<String> archive(User user, byte[] bytes, String filename, String contentType, String documentType) {
        return kernelAuthService.ensureToken(user)
                .flatMap(token -> {
                    MultipartBodyBuilder body = new MultipartBodyBuilder();
                    body.part("file", new ByteArrayResource(bytes) {
                        @Override
                        public String getFilename() {
                            return filename;
                        }
                    }).contentType(MediaType.parseMediaType(contentType));
                    if (documentType != null) {
                        body.part("documentType", documentType);
                    }

                    return WebClient.create(kernelBaseUrl).post()
                            .uri("/api/files")
                            .header("X-Client-Id", clientId)
                            .header("X-Api-Key", apiKey)
                            .header("X-Tenant-Id", tenantId)
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                            .body(BodyInserters.fromMultipartData(body.build()))
                            .retrieve()
                            .bodyToMono(KernelResponse.class)
                            .map(r -> r.getData() != null ? r.getData().path("id").asText("") : "");
                });
    }
}
