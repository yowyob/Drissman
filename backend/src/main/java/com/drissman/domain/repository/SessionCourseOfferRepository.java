package com.drissman.domain.repository;

import com.drissman.domain.entity.SessionCourseOffer;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public interface SessionCourseOfferRepository extends ReactiveCrudRepository<SessionCourseOffer, UUID> {
    Flux<SessionCourseOffer> findBySessionId(UUID sessionId);
    Flux<SessionCourseOffer> findByOfferId(UUID offerId);
    Mono<Void> deleteBySessionId(UUID sessionId);
}
