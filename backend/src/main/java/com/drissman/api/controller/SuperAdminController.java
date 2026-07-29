package com.drissman.api.controller;

import com.drissman.api.dto.GlobalStatsDto;
import com.drissman.domain.entity.School;
import com.drissman.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final SuperAdminService superAdminService;

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
