package com.drissman.api.controller;

import com.drissman.api.dto.PartnerStatsDto;
import com.drissman.api.dto.UpdateSchoolRequest;
import com.drissman.api.dto.AdminDashboardDto;
import com.drissman.domain.repository.UserRepository;

import com.drissman.service.AdminSchoolService;
import com.drissman.service.SchoolService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/schools/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminSchoolController {

    private final AdminSchoolService adminSchoolService;
    private final SchoolService schoolService;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    public Mono<AdminDashboardDto> getDashboardStats(Principal principal) {
        if (principal == null) {
            return Mono.empty();
        }

        UUID userId = UUID.fromString(principal.getName());
        return userRepository.findById(userId)
                .flatMap(user -> {
                    if (user.getSchoolId() == null) {
                        return Mono.empty();
                    }
                    return adminSchoolService.getDashboardStats(user.getSchoolId());
                });
    }

    @GetMapping("/stats")
    public Mono<PartnerStatsDto> getStats(Principal principal) {
        // Plus de "demo mode" : un appel non authentifié est refusé, jamais
        // servi avec des chiffres fictifs.
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }

        log.info("Fetching stats for user: {}", principal.getName());
        UUID userId = UUID.fromString(principal.getName());

        return userRepository.findById(userId)
                .flatMap(user -> {
                    if (user.getSchoolId() == null) {
                        return Mono.just(PartnerStatsDto.builder()
                                .revenue("0 FCFA")
                                .enrollments(0)
                                .successRate("0%")
                                .upcomingLessons(0)
                                .revenueGrowth(0.0)
                                .enrollmentGrowth(0)
                                .build());
                    }
                    return adminSchoolService.getStats(user.getSchoolId());
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Utilisateur non trouvé")));
    }

    @PatchMapping
    public Mono<Void> updateSchool(Principal principal, @RequestBody UpdateSchoolRequest request) {
        if (principal == null)
            return Mono.empty();

        UUID userId = UUID.fromString(principal.getName());
        return userRepository.findById(userId)
                .flatMap(user -> {
                    if (user.getSchoolId() == null)
                        return Mono.empty();
                    return schoolService.update(user.getSchoolId(), request)
                            .then();
                });
    }

}
