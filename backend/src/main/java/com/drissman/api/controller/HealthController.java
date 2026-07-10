package com.drissman.api.controller;

import com.drissman.kernel.KernelClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    private final KernelClient kernelClient;

    @GetMapping("/health")
    public Mono<Map<String, String>> health() {
        return Mono.just(Map.of(
                "status", "UP",
                "service", "drissman-backend"));
    }

    /**
     * Vérifie la connectivité et l'identité machine auprès du kernel-core.
     * Appel sans effet de bord : identification d'un principal fictif.
     */
    @GetMapping("/health/kernel")
    public Mono<Map<String, String>> kernelHealth() {
        return kernelClient.post("/api/auth/identify", Map.of("principal", "healthcheck@drissman.local"))
                .timeout(Duration.ofSeconds(15))
                .map(r -> Map.of(
                        "kernel", r.isSuccess() ? "UP" : "DOWN",
                        "message", r.getMessage() != null ? r.getMessage() : ""))
                .onErrorResume(e -> Mono.just(Map.of(
                        "kernel", "DOWN",
                        "error", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName())));
    }
}
