package com.drissman.api.controller;

import com.drissman.api.dto.DocumentChecklistItemDto;
import com.drissman.api.dto.GlobalStatsDto;
import com.drissman.api.dto.RejectSchoolRequest;
import com.drissman.api.dto.ReviewDocumentRequest;
import com.drissman.domain.entity.School;
import com.drissman.domain.repository.UserRepository;
import com.drissman.service.SchoolDocumentService;
import com.drissman.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final SuperAdminService superAdminService;
    private final SchoolDocumentService schoolDocumentService;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    public Mono<GlobalStatsDto> getGlobalStats() {
        return superAdminService.getGlobalStats();
    }

    @GetMapping("/schools/pending")
    public Flux<School> getPendingSchools() {
        return superAdminService.getPendingSchools();
    }

    @PutMapping("/schools/{id}/validate")
    public Mono<School> validateSchool(@PathVariable UUID id) {
        return superAdminService.validateSchool(id);
    }

    @PutMapping("/schools/{id}/reject")
    public Mono<School> rejectSchool(@PathVariable UUID id, @RequestBody RejectSchoolRequest request) {
        return superAdminService.rejectSchool(id, request != null ? request.getReason() : null);
    }

    /** Pièces justificatives d'une école (checklist) pour la revue super-admin. */
    @GetMapping("/schools/{id}/documents")
    public Mono<List<DocumentChecklistItemDto>> getSchoolDocuments(@PathVariable UUID id) {
        return schoolDocumentService.getChecklist(id);
    }

    /** Moniteurs d'une école, pour accéder à leur revue documentaire. */
    @GetMapping("/schools/{schoolId}/monitors")
    public Flux<com.drissman.api.dto.MonitorDto> getSchoolMonitors(@PathVariable UUID schoolId) {
        return superAdminService.getSchoolMonitors(schoolId);
    }

    /** Pièces justificatives d'un moniteur (checklist) pour la revue super-admin. */
    @GetMapping("/monitors/{monitorId}/documents")
    public Mono<List<DocumentChecklistItemDto>> getMonitorDocuments(@PathVariable UUID monitorId) {
        return schoolDocumentService.getMonitorChecklist(monitorId);
    }

    /** Revue d'une pièce : APPROVE/REJECT → statut local + miroir kernel. */
    @PutMapping("/documents/{documentId}/review")
    public Mono<List<DocumentChecklistItemDto>> reviewDocument(
            Principal principal,
            @PathVariable UUID documentId,
            @RequestBody ReviewDocumentRequest request) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }
        UUID reviewerId = UUID.fromString(principal.getName());
        return userRepository.findById(reviewerId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable")))
                .flatMap(reviewer -> schoolDocumentService.reviewDocument(
                        reviewer, documentId,
                        request != null ? request.getDecision() : null,
                        request != null ? request.getNotes() : null));
    }

    @GetMapping("/schools")
    public Flux<School> getAllSchools() {
        return superAdminService.getAllSchools();
    }

    @PutMapping("/schools/{id}/toggle-verify")
    public Mono<School> toggleSchoolVerification(@PathVariable UUID id) {
        return superAdminService.toggleSchoolVerification(id);
    }

    @GetMapping("/users")
    public Flux<com.drissman.domain.entity.User> getAllUsers() {
        return superAdminService.getAllUsers();
    }

    @PutMapping("/users/{id}/toggle-active")
    public Mono<com.drissman.domain.entity.User> toggleUserActive(@PathVariable UUID id) {
        return superAdminService.toggleUserActive(id);
    }
}
