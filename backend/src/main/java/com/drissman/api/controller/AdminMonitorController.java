package com.drissman.api.controller;

import com.drissman.api.dto.CreateMonitorRequest;
import com.drissman.api.dto.MonitorDto;
import com.drissman.api.dto.UpdateMonitorRequest;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import com.drissman.service.MonitorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/schools/admin/monitors")
@RequiredArgsConstructor
public class AdminMonitorController {

    private final MonitorService monitorService;
    private final UserRepository userRepository;

    @GetMapping
    public Flux<MonitorDto> getMonitors(Principal principal) {
        return getSchoolId(principal)
                .flatMapMany(monitorService::getMonitorsBySchool);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<MonitorDto> createMonitor(
            Principal principal,
            @Valid @RequestBody CreateMonitorRequest request) {
        return getSchoolId(principal)
                .flatMap(schoolId -> monitorService.createMonitor(schoolId, request));
    }

    @PatchMapping("/{id}")
    public Mono<MonitorDto> updateMonitor(
            Principal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMonitorRequest request) {
        return getSchoolId(principal)
                .flatMap(schoolId -> monitorService.updateMonitor(schoolId, id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteMonitor(Principal principal, @PathVariable UUID id) {
        return getSchoolId(principal)
                .flatMap(schoolId -> monitorService.deleteMonitor(schoolId, id));
    }

    private Mono<UUID> getSchoolId(Principal principal) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }
        return userRepository.findById(UUID.fromString(principal.getName()))
                .map(User::getSchoolId)
                .filter(schoolId -> schoolId != null)
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.BAD_REQUEST, "Utilisateur non associe a une ecole")));
    }
}
