package com.drissman.domain.repository;

import com.drissman.domain.entity.OfferMonitor;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public interface OfferMonitorRepository extends ReactiveCrudRepository<OfferMonitor, UUID> {
    Flux<OfferMonitor> findByOfferId(UUID offerId);
    Flux<OfferMonitor> findByMonitorId(UUID monitorId);
    Mono<Void> deleteByOfferId(UUID offerId);
}
