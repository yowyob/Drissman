package com.drissman.api.controller;

import com.drissman.api.dto.ChangePasswordRequest;
import com.drissman.api.dto.UpdateProfileRequest;
import com.drissman.api.dto.UserDto;
import com.drissman.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public Mono<UserDto> getCurrentUser(Principal principal) {
        if (principal == null) {
            return Mono.error(new RuntimeException("Authentification requise"));
        }
        UUID userId = UUID.fromString(principal.getName());
        return userService.findById(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("Utilisateur non trouve")));
    }

    @GetMapping("/{id}")
    public Mono<UserDto> getUser(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return Mono.error(new RuntimeException("Authentification requise"));
        }
        UUID authenticatedUserId = UUID.fromString(principal.getName());
        if (!authenticatedUserId.equals(id)) {
            return Mono.error(new IllegalArgumentException("Acces refuse"));
        }
        return userService.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Utilisateur non trouve")));
    }

    @PutMapping("/{id}")
    public Mono<UserDto> updateProfile(
            Principal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProfileRequest request) {
        if (principal == null) {
            return Mono.error(new RuntimeException("Authentification requise"));
        }
        UUID authenticatedUserId = UUID.fromString(principal.getName());
        if (!authenticatedUserId.equals(id)) {
            return Mono.error(new IllegalArgumentException("Vous ne pouvez modifier que votre propre profil"));
        }
        return userService.updateProfile(id, request);
    }

    @PutMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> changePassword(
            Principal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (principal == null) {
            return Mono.error(new RuntimeException("Authentification requise"));
        }
        UUID authenticatedUserId = UUID.fromString(principal.getName());
        if (!authenticatedUserId.equals(id)) {
            return Mono.error(new IllegalArgumentException("Vous ne pouvez modifier que votre propre mot de passe"));
        }
        return userService.changePassword(id, request);
    }
}
