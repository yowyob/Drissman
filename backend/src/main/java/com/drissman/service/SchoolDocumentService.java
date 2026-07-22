package com.drissman.service;

import com.drissman.api.dto.DocumentChecklistItemDto;
import com.drissman.domain.entity.DocumentCategory;
import com.drissman.domain.entity.School;
import com.drissman.domain.entity.SchoolDocument;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.SchoolDocumentRepository;
import com.drissman.domain.repository.SchoolRepository;
import com.drissman.kernel.KernelDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Gestion des pièces justificatives d'une auto-école (KYC).
 *
 * Le fichier est stocké localement (source publique rapide) et, best-effort,
 * archivé + rattaché au Document-hub kernel. Le statut local pilote la
 * checklist affichée au gérant.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SchoolDocumentService {

    private final SchoolDocumentRepository documentRepository;
    private final SchoolRepository schoolRepository;
    private final ImageStorageService storageService;
    private final KernelDocumentService kernelDocumentService;

    /** Téléverse une pièce pour l'école du gérant, puis renvoie la checklist à jour. */
    public Mono<List<DocumentChecklistItemDto>> upload(User schoolAdmin, byte[] bytes, String filename,
                                                       String contentType, String categoryCode) {
        UUID schoolId = schoolAdmin.getSchoolId();
        if (schoolId == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Aucune auto-école rattachée à ce compte"));
        }
        DocumentCategory category = DocumentCategory.fromCode(categoryCode);
        if (category == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Catégorie de document inconnue"));
        }
        if (bytes == null || bytes.length == 0) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier vide"));
        }

        return storageService.saveBytes(bytes, filename)
                .flatMap(storedName -> {
                    SchoolDocument doc = SchoolDocument.builder()
                            .schoolId(schoolId)
                            .category(category.name())
                            .label(filename)
                            .fileUrl("/api/images/" + storedName)
                            .status(SchoolDocument.Status.PENDING)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return documentRepository.save(doc);
                })
                .doOnNext(saved -> mirrorToKernelInBackground(schoolAdmin, saved, bytes, filename, contentType, category))
                .then(getChecklist(schoolId));
    }

    /** Checklist complète : chaque catégorie attendue + l'état de la pièce fournie. */
    public Mono<List<DocumentChecklistItemDto>> getChecklist(UUID schoolId) {
        return documentRepository.findBySchoolId(schoolId)
                .collectList()
                .map(docs -> {
                    // Dernière pièce fournie par catégorie.
                    Map<String, SchoolDocument> latestByCategory = docs.stream()
                            .collect(Collectors.toMap(
                                    SchoolDocument::getCategory,
                                    d -> d,
                                    (a, b) -> after(a.getCreatedAt(), b.getCreatedAt()) ? a : b));

                    return java.util.Arrays.stream(DocumentCategory.values())
                            .map(cat -> {
                                SchoolDocument d = latestByCategory.get(cat.name());
                                return DocumentChecklistItemDto.builder()
                                        .category(cat.name())
                                        .label(cat.label())
                                        .required(cat.required())
                                        .status(d != null ? d.getStatus() : "MISSING")
                                        .documentId(d != null ? d.getId() : null)
                                        .fileUrl(d != null ? d.getFileUrl() : null)
                                        .reviewNotes(d != null ? d.getReviewNotes() : null)
                                        .uploadedAt(d != null ? d.getCreatedAt() : null)
                                        .build();
                            })
                            .collect(Collectors.toList());
                });
    }

    /**
     * Revue d'une pièce par le super-admin : fixe le statut local (VERIFIED/REJECTED),
     * miroite la décision au document-governance kernel (best-effort), et renvoie
     * la checklist à jour de l'école concernée.
     */
    public Mono<List<DocumentChecklistItemDto>> reviewDocument(User reviewer, UUID documentId,
                                                               String decisionRaw, String notes) {
        String decision = decisionRaw == null ? "" : decisionRaw.trim().toUpperCase(Locale.ROOT);
        final String localStatus;
        final String kernelStatus;
        if (decision.equals("APPROVE") || decision.equals("APPROVED") || decision.equals("VERIFIED")) {
            localStatus = SchoolDocument.Status.VERIFIED;
            kernelStatus = "APPROVED";
        } else if (decision.equals("REJECT") || decision.equals("REJECTED")) {
            localStatus = SchoolDocument.Status.REJECTED;
            kernelStatus = "REJECTED";
        } else {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Décision invalide (attendu : APPROVE ou REJECT)"));
        }
        String trimmedNotes = notes != null && !notes.isBlank() ? notes.trim() : null;

        return documentRepository.findById(documentId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Document introuvable")))
                .flatMap(doc -> {
                    doc.setStatus(localStatus);
                    doc.setReviewNotes(trimmedNotes);
                    doc.setUpdatedAt(LocalDateTime.now());
                    return documentRepository.save(doc);
                })
                .doOnNext(doc -> {
                    // Miroir Kernel best-effort si la pièce a été rattachée au Document-hub.
                    if (doc.getKernelDocumentLinkId() != null) {
                        kernelDocumentService.review(reviewer, doc.getKernelDocumentLinkId(), kernelStatus, trimmedNotes)
                                .subscribeOn(Schedulers.boundedElastic())
                                .subscribe(v -> {}, e -> log.debug("Miroir review kernel indisponible pour {} : {}",
                                        doc.getId(), e.getMessage()));
                    }
                })
                .flatMap(doc -> getChecklist(doc.getSchoolId()));
    }

    /** Archive + rattache au Document-hub kernel sans bloquer la réponse au gérant. */
    private void mirrorToKernelInBackground(User schoolAdmin, SchoolDocument saved, byte[] bytes,
                                            String filename, String contentType, DocumentCategory category) {
        schoolRepository.findById(saved.getSchoolId())
                .flatMap((School school) -> kernelDocumentService
                        .archiveAndAttach(schoolAdmin, school, bytes, filename, contentType, category.name())
                        .flatMap(refs -> {
                            saved.setKernelFileId(refs.kernelFileId());
                            saved.setKernelDocumentLinkId(refs.documentLinkId());
                            saved.setUpdatedAt(LocalDateTime.now());
                            return documentRepository.save(saved);
                        }))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(v -> {}, e -> log.debug("Miroir document kernel indisponible pour {} : {}",
                        saved.getId(), e.getMessage()));
    }

    private static boolean after(LocalDateTime a, LocalDateTime b) {
        if (a == null) return false;
        if (b == null) return true;
        return a.isAfter(b);
    }
}
