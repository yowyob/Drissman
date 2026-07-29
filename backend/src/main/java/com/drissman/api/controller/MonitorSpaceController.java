package com.drissman.api.controller;

import com.drissman.api.dto.MonitorDto;
import com.drissman.api.dto.MonitorSessionViewDto;
import com.drissman.api.dto.MonitorStudentProgressDto;
import com.drissman.api.dto.SessionDto;
import com.drissman.service.MonitorService;
import com.drissman.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/monitors")
@RequiredArgsConstructor
public class MonitorSpaceController {

    private final MonitorService monitorService;
    private final SessionService sessionService;

    @GetMapping("/me")
    public Mono<MonitorDto> getCurrentMonitorProfile(Principal principal) {
        if (principal == null) {
            return Mono.error(new RuntimeException("Authentification requise"));
        }

        UUID userId = UUID.fromString(principal.getName());
        return monitorService.getMonitorByUserId(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("Profil moniteur non trouve pour cet utilisateur")));
    }

    @GetMapping("/me/sessions")
    public Flux<MonitorSessionViewDto> getMySessions(Principal principal) {
        if (principal == null) {
            return Flux.error(new RuntimeException("Authentification requise"));
        }

        UUID userId = UUID.fromString(principal.getName());
        return sessionService.getMonitorSessionsByUserId(userId);
    }

    @GetMapping("/me/sessions/{id}/students")
    public Flux<MonitorStudentProgressDto> getSessionStudents(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return Flux.error(new RuntimeException("Authentification requise"));
        }
        return sessionService.getSessionStudents(id);
    }

    @PatchMapping("/me/sessions/{id}/complete")
    public Mono<SessionDto> completeMySession(
            Principal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String notes) {
        if (principal == null) {
            return Mono.error(new RuntimeException("Authentification requise"));
        }

        UUID userId = UUID.fromString(principal.getName());
        return sessionService.completeSessionByMonitor(userId, id, notes);
    }

    @GetMapping("/me/students")
    public Flux<MonitorStudentProgressDto> getMyStudents(Principal principal) {
        if (principal == null) {
            return Flux.error(new RuntimeException("Authentification requise"));
        }

        UUID userId = UUID.fromString(principal.getName());
        return sessionService.getStudentsForMonitor(userId);
    }
}
