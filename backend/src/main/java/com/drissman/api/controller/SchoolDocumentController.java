package com.drissman.api.controller;

import com.drissman.api.dto.DocumentChecklistItemDto;
import com.drissman.domain.repository.UserRepository;
import com.drissman.service.SchoolDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

/**
 * Pièces justificatives d'une auto-école (KYC), gérées par le gérant.
 * Réservé au SCHOOL_ADMIN (cf. SecurityConfig : /api/schools/admin/**).
 */
@RestController
@RequestMapping("/api/schools/admin/documents")
@RequiredArgsConstructor
public class SchoolDocumentController {

    private final SchoolDocumentService schoolDocumentService;
    private final UserRepository userRepository;

    /** Checklist documentaire de l'école du gérant. */
    @GetMapping
    public Mono<List<DocumentChecklistItemDto>> getChecklist(Principal principal) {
        return currentUserSchoolId(principal)
                .flatMap(schoolDocumentService::getChecklist);
    }

    /** Téléversement d'une pièce (multipart `file` + paramètre `category`). */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<List<DocumentChecklistItemDto>> upload(
            Principal principal,
            @RequestPart("file") Mono<FilePart> filePartMono,
            @RequestParam("category") String category) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }
        UUID userId = UUID.fromString(principal.getName());
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable")))
                .flatMap(user -> filePartMono.flatMap(filePart -> DataBufferUtils
                        .join(filePart.content())
                        .map(buffer -> {
                            byte[] bytes = new byte[buffer.readableByteCount()];
                            buffer.read(bytes);
                            DataBufferUtils.release(buffer);
                            return bytes;
                        })
                        .flatMap(bytes -> {
                            String contentType = filePart.headers().getContentType() != null
                                    ? filePart.headers().getContentType().toString()
                                    : MediaType.APPLICATION_OCTET_STREAM_VALUE;
                            return schoolDocumentService.upload(user, bytes, filePart.filename(), contentType, category);
                        })));
    }

    /** Checklist documentaire d'un moniteur de l'école du gérant. */
    @GetMapping("/monitors/{monitorId}")
    public Mono<List<DocumentChecklistItemDto>> getMonitorChecklist(
            Principal principal, @PathVariable UUID monitorId) {
        return currentUserSchoolId(principal)
                .then(schoolDocumentService.getMonitorChecklist(monitorId));
    }

    /** Téléversement d'une pièce de moniteur par le gérant (multipart + `category`). */
    @PostMapping(path = "/monitors/{monitorId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<List<DocumentChecklistItemDto>> uploadMonitorDocument(
            Principal principal,
            @PathVariable UUID monitorId,
            @RequestPart("file") Mono<FilePart> filePartMono,
            @RequestParam("category") String category) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }
        UUID userId = UUID.fromString(principal.getName());
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable")))
                .flatMap(user -> filePartMono.flatMap(filePart -> DataBufferUtils
                        .join(filePart.content())
                        .map(buffer -> {
                            byte[] bytes = new byte[buffer.readableByteCount()];
                            buffer.read(bytes);
                            DataBufferUtils.release(buffer);
                            return bytes;
                        })
                        .flatMap(bytes -> {
                            String contentType = filePart.headers().getContentType() != null
                                    ? filePart.headers().getContentType().toString()
                                    : MediaType.APPLICATION_OCTET_STREAM_VALUE;
                            return schoolDocumentService.uploadMonitorDocument(
                                    user, monitorId, bytes, filePart.filename(), contentType, category);
                        })));
    }

    private Mono<UUID> currentUserSchoolId(Principal principal) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }
        UUID userId = UUID.fromString(principal.getName());
        return userRepository.findById(userId)
                .flatMap(user -> user.getSchoolId() == null
                        ? Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Aucune auto-école rattachée à ce compte"))
                        : Mono.just(user.getSchoolId()));
    }
}
