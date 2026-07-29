package com.drissman.api.controller;

import com.drissman.api.dto.AuthResponse;
import com.drissman.api.dto.LoginRequest;
import com.drissman.api.dto.RegisterRequest;
import com.drissman.api.dto.UpgradeVisitorRoleRequest;
import com.drissman.api.dto.GoogleLoginRequest;
import com.drissman.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public Mono<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    public Mono<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return authService.loginWithGoogle(request);
    }

    @PostMapping("/upgrade-visitor")
    public Mono<AuthResponse> upgradeVisitor(
            Principal principal,
            @Valid @RequestBody UpgradeVisitorRoleRequest request) {
        if (principal == null) {
            return Mono.error(new RuntimeException("Authentification requise"));
        }
        return authService.upgradeVisitorRole(UUID.fromString(principal.getName()), request);
    }
}
