package com.drissman.kernel;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cache mémoire des access tokens kernel (durée de vie ~15 min).
 * Clé = id utilisateur Drissman local. Un token expiré est purgé à la lecture.
 */
@Component
public class KernelTokenStore {

    private record Entry(String token, Instant expiresAt) {
    }

    private final Map<UUID, Entry> tokens = new ConcurrentHashMap<>();

    public void put(UUID userId, String token, long ttlSeconds) {
        // Marge de 60 s pour éviter d'utiliser un token à la limite de l'expiration.
        Instant expiresAt = Instant.now().plusSeconds(Math.max(ttlSeconds - 60, 30));
        tokens.put(userId, new Entry(token, expiresAt));
    }

    public Optional<String> get(UUID userId) {
        Entry entry = tokens.get(userId);
        if (entry == null) {
            return Optional.empty();
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            tokens.remove(userId);
            return Optional.empty();
        }
        return Optional.of(entry.token());
    }

    public void evict(UUID userId) {
        tokens.remove(userId);
    }
}
