package com.drissman.api.controller;

import com.drissman.kernel.KernelAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.UUID;

/**
 * Pilotage de la session administrateur kernel depuis le backend Drissman.
 * Réservé aux rôles SCHOOL_ADMIN / SUPER_ADMIN (cf. SecurityConfig).
 *
 * Workflow : POST /login -> code MFA reçu par email -> POST /mfa/confirm
 * -> POST /organizations/{schoolId} pour provisionner une école.
 */
@RestController
@RequestMapping("/api/kernel/admin")
@RequiredArgsConstructor
public class KernelAdminController {

    private final KernelAdminService kernelAdminService;

    @PostMapping("/login")
    public Mono<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String principal = body.get("principal");
        String password = body.get("password");
        if (principal == null || principal.isBlank() || password == null || password.isBlank()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Champs requis : principal, password"));
        }
        return kernelAdminService.login(principal, password);
    }

    @PostMapping("/mfa/confirm")
    public Mono<Map<String, Object>> confirmMfa(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Champ requis : code"));
        }
        return kernelAdminService.confirmMfa(code.trim());
    }

    @GetMapping("/status")
    public Mono<Map<String, Object>> status() {
        return Mono.just(kernelAdminService.status());
    }

    @PostMapping("/organizations/{schoolId}")
    public Mono<Map<String, Object>> createOrganization(@PathVariable UUID schoolId) {
        return kernelAdminService.createOrganizationForSchool(schoolId);
    }
}
