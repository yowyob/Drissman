package com.drissman.domain.repository;

import com.drissman.domain.entity.OfferModule;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface OfferModuleRepository extends ReactiveCrudRepository<OfferModule, UUID> {

    Flux<OfferModule> findByOfferIdOrderByOrderIndexAsc(UUID offerId);

    Flux<OfferModule> findByModuleId(UUID moduleId);

    Mono<Void> deleteByOfferId(UUID offerId);

    Mono<OfferModule> findByOfferIdAndModuleId(UUID offerId, UUID moduleId);
}
