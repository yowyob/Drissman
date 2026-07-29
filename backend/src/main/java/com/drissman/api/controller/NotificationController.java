package com.drissman.api.controller;

import com.drissman.api.dto.NotificationDto;
import com.drissman.service.NotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public Flux<NotificationDto> getUserNotifications(Principal principal) {
        if (principal == null) return Flux.empty();
        UUID userId = UUID.fromString(principal.getName());
        return notificationService.getUserNotifications(userId);
    }

    @PatchMapping("/{id}/read")
    public Mono<Void> markAsRead(@PathVariable UUID id, Principal principal) {
        if (principal == null) return Mono.empty();
        return notificationService.markAsRead(id);
    }

    @PostMapping("/read-all")
    public Mono<Void> markAllAsRead(Principal principal) {
        if (principal == null) return Mono.empty();
        UUID userId = UUID.fromString(principal.getName());
        return notificationService.markAllAsRead(userId);
    }

    @PostMapping("/register-token")
    public Mono<Void> registerToken(@RequestBody RegisterTokenRequest request, Principal principal) {
        if (principal == null || request.getToken() == null) return Mono.empty();
        UUID userId = UUID.fromString(principal.getName());
        return notificationService.registerPushToken(userId, request.getToken());
    }

    @Data
    public static class RegisterTokenRequest {
        private String token;
        private String platform;
    }
}
