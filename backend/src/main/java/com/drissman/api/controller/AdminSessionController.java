package com.drissman.api.controller;

import com.drissman.api.dto.CreateSessionRequest;
import com.drissman.api.dto.AvailableOfferDto;
import com.drissman.api.dto.SessionEnrollmentOptionDto;
import com.drissman.api.dto.SessionDto;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import com.drissman.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/schools/admin/sessions")
@RequiredArgsConstructor
public class AdminSessionController {

    private final SessionService sessionService;
    private final UserRepository userRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<SessionDto> createSession(
            Principal principal,
            @Valid @RequestBody CreateSessionRequest request) {
        return getSchoolId(principal)
                .flatMap(schoolId -> sessionService.scheduleSession(schoolId, request));
    }

    @GetMapping
    public Flux<SessionDto> getSchoolSessions(Principal principal) {
        return getSchoolId(principal).flatMapMany(sessionService::getSessionsForSchool);
    }

    @GetMapping("/enrollment/{enrollmentId}")
    public Flux<SessionDto> getSessionsByEnrollment(
            Principal principal,
            @PathVariable UUID enrollmentId) {
        return getSchoolId(principal)
                .flatMapMany(schoolId -> sessionService.getSessionsForEnrollment(schoolId, enrollmentId));
    }

    @GetMapping("/monitor/{monitorId}")
    public Flux<SessionDto> getSessionsByMonitor(
            Principal principal,
            @PathVariable UUID monitorId) {
        return getSchoolId(principal)
                .flatMapMany(schoolId -> sessionService.getSessionsForMonitor(schoolId, monitorId));
    }

    @GetMapping("/available-offers")
    public Flux<AvailableOfferDto> getAvailableOffers(
            Principal principal,
            @RequestParam LocalDate date) {
        return getSchoolId(principal)
                .flatMapMany(schoolId -> sessionService.getAvailableOffersForDate(schoolId, date));
    }

    @GetMapping("/available-enrollments")
    public Flux<SessionEnrollmentOptionDto> getAvailableEnrollments(
            Principal principal,
            @RequestParam UUID offerId,
            @RequestParam LocalDate date) {
        return getSchoolId(principal)
                .flatMapMany(schoolId -> sessionService.getAvailableEnrollments(schoolId, offerId, date));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> cancelSession(
            Principal principal,
            @PathVariable UUID id) {
        return getSchoolId(principal)
                .flatMap(schoolId -> sessionService.cancelSession(schoolId, id));
    }

    @PatchMapping("/{id}/complete")
    public Mono<SessionDto> completeSession(
            Principal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String notes) {
        return getSchoolId(principal)
                .flatMap(schoolId -> sessionService.completeSession(schoolId, id, notes));
    }

    private Mono<UUID> getSchoolId(Principal principal) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }

        return userRepository.findById(UUID.fromString(principal.getName()))
                .map(User::getSchoolId)
                .filter(schoolId -> schoolId != null)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Compte non associe a une ecole")));
    }
}
