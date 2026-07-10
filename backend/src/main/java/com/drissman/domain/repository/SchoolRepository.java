package com.drissman.domain.repository;

import com.drissman.domain.entity.School;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface SchoolRepository extends ReactiveCrudRepository<School, UUID> {
    Flux<School> findByCity(String city);

    @Query("SELECT * FROM schools WHERE city ILIKE :city ORDER BY rating DESC")
    Flux<School> findByCityOrderByRatingDesc(String city);

    @org.springframework.data.r2dbc.repository.Modifying
    @Query("UPDATE schools SET is_verified = true WHERE id = :id")
    reactor.core.publisher.Mono<Integer> validateSchool(UUID id);

    @org.springframework.data.r2dbc.repository.Modifying
    @Query("UPDATE schools SET is_verified = :isVerified WHERE id = :id")
    reactor.core.publisher.Mono<Integer> updateVerificationStatus(java.util.UUID id, boolean isVerified);

    @Query("SELECT * FROM schools ORDER BY created_at DESC LIMIT 10")
    Flux<School> findRecentSchools();
}
