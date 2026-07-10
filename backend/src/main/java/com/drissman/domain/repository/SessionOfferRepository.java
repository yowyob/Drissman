package com.drissman.domain.repository;

import com.drissman.domain.entity.SessionOffer;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface SessionOfferRepository extends ReactiveCrudRepository<SessionOffer, UUID> {

    Flux<SessionOffer> findByTrainingPeriodId(UUID trainingPeriodId);

    Flux<SessionOffer> findByOfferId(UUID offerId);

    Mono<Void> deleteByTrainingPeriodId(UUID trainingPeriodId);

    Mono<Long> countByTrainingPeriodId(UUID trainingPeriodId);
}
