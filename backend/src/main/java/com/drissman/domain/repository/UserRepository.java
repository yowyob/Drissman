package com.drissman.domain.repository;

import com.drissman.domain.entity.User;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserRepository extends ReactiveCrudRepository<User, UUID> {
    Mono<User> findByEmail(String email);

    @org.springframework.data.r2dbc.repository.Query("SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(:email)) LIMIT 1")
    Mono<User> findFirstByEmailIgnoreCase(String email);

    Mono<Boolean> existsByEmail(String email);

    Mono<User> findFirstBySchoolIdAndRole(UUID schoolId, User.Role role);

    @org.springframework.data.r2dbc.repository.Modifying
    @org.springframework.data.r2dbc.repository.Query("UPDATE users SET is_active = :isActive WHERE id = :id")
    Mono<Integer> updateActiveStatus(java.util.UUID id, boolean isActive);
}
