package com.drissman.service;

import com.drissman.api.dto.DocumentChecklistItemDto;
import com.drissman.domain.entity.DocumentCategory;
import com.drissman.domain.entity.School;
import com.drissman.domain.entity.SchoolDocument;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.MonitorRepository;
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
    private final MonitorRepository monitorRepository;
    private final ImageStorageService storageService;
    private final KernelDocumentService kernelDocumentService;

    /** Téléverse une pièce de l'AUTO-ÉCOLE du gérant, puis renvoie la checklist à jour. */
    public Mono<List<DocumentChecklistItemDto>> upload(User schoolAdmin, byte[] bytes, String filename,
                                                       String contentType, String categoryCode) {
        UUID schoolId = schoolAdmin.getSchoolId();
        if (schoolId == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Aucune auto-école rattachée à ce compte"));
        }
        DocumentCategory category = DocumentCategory.fromCode(categoryCode);
        if (category == null || category.scope() != DocumentCategory.Scope.SCHOOL) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Catégorie de document invalide pour une auto-école"));
        }
        return store(schoolAdmin, schoolId, null, bytes, filename, contentType, category)
                .then(getChecklist(schoolId));
    }

    /**
     * Téléverse une pièce d'un MONITEUR. C'est le GÉRANT qui dépose (c'est lui
     * qui crée le moniteur) ; le moniteur ne téléverse jamais lui-même.
     * Le verdict reste rendu par le super-admin.
     */
    public Mono<List<DocumentChecklistItemDto>> uploadMonitorDocument(User schoolAdmin, UUID monitorId,
                                                                      byte[] bytes, String filename,
                                                                      String contentType, String categoryCode) {
        UUID schoolId = schoolAdmin.getSchoolId();
        if (schoolId == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Aucune auto-école rattachée à ce compte"));
        }
        DocumentCategory category = DocumentCategory.fromCode(categoryCode);
        if (category == null || category.scope() != DocumentCategory.Scope.MONITOR) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Catégorie de document invalide pour un moniteur"));
        }
        return monitorRepository.findById(monitorId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Moniteur introuvable")))
                .filter(m -> schoolId.equals(m.getSchoolId()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Ce moniteur n'appartient pas à votre auto-école")))
                .flatMap(m -> store(schoolAdmin, schoolId, monitorId, bytes, filename, contentType, category))
                .then(getMonitorChecklist(monitorId));
    }

    /** Enregistrement local + miroir kernel — commun école/moniteur. */
    private Mono<SchoolDocument> store(User uploader, UUID schoolId, UUID monitorId, byte[] bytes,
                                       String filename, String contentType, DocumentCategory category) {
        if (bytes == null || bytes.length == 0) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier vide"));
        }
        return storageService.saveBytes(bytes, filename)
                .flatMap(storedName -> documentRepository.save(SchoolDocument.builder()
                        .schoolId(schoolId)
                        .monitorId(monitorId)
                        .category(category.name())
                        .label(filename)
                        .fileUrl("/api/images/" + storedName)
                        .status(SchoolDocument.Status.PENDING)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()))
                .doOnNext(saved -> mirrorToKernelInBackground(uploader, saved, bytes, filename, contentType, category));
    }

    /** Checklist de l'AUTO-ÉCOLE (pièces non rattachées à un moniteur). */
    public Mono<List<DocumentChecklistItemDto>> getChecklist(UUID schoolId) {
        return documentRepository.findBySchoolId(schoolId)
                .filter(d -> d.getMonitorId() == null)
                .collectList()
                .map(docs -> buildChecklist(docs, DocumentCategory.Scope.SCHOOL));
    }

    /** Checklist d'un MONITEUR. */
    public Mono<List<DocumentChecklistItemDto>> getMonitorChecklist(UUID monitorId) {
        return documentRepository.findByMonitorId(monitorId)
                .collectList()
                .map(docs -> buildChecklist(docs, DocumentCategory.Scope.MONITOR));
    }

    /** Chaque catégorie attendue de la portée + l'état de la pièce fournie. */
    private List<DocumentChecklistItemDto> buildChecklist(List<SchoolDocument> docs, DocumentCategory.Scope scope) {
        // Dernière pièce fournie par catégorie.
        Map<String, SchoolDocument> latestByCategory = docs.stream()
                .collect(Collectors.toMap(
                        SchoolDocument::getCategory,
                        d -> d,
                        (a, b) -> after(a.getCreatedAt(), b.getCreatedAt()) ? a : b));

        return DocumentCategory.of(scope).stream()
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
                            // Référence kernel obtenue = pièce réellement rattachée au Document-hub.
                            .kernelSynced(d != null && d.getKernelDocumentLinkId() != null)
                            .build();
                })
                .collect(Collectors.toList());
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
                .flatMap(doc -> doc.getMonitorId() != null
                        ? getMonitorChecklist(doc.getMonitorId())
                        : getChecklist(doc.getSchoolId()));
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
