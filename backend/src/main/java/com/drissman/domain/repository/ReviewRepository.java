package com.drissman.domain.repository;

import com.drissman.domain.entity.Review;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ReviewRepository extends ReactiveCrudRepository<Review, UUID> {
    Flux<Review> findBySchoolId(UUID schoolId);

    Flux<Review> findByUserId(UUID userId);

    Mono<Review> findByUserIdAndSchoolId(UUID userId, UUID schoolId);

    @Query("SELECT AVG(rating) FROM reviews WHERE school_id = :schoolId")
    Mono<Double> getAverageRatingBySchoolId(UUID schoolId);

    @Query("SELECT COUNT(*) FROM reviews WHERE school_id = :schoolId")
    Mono<Long> countBySchoolId(UUID schoolId);
}
