package com.drissman.domain.repository;

import com.drissman.domain.entity.Offer;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface OfferRepository extends ReactiveCrudRepository<Offer, UUID> {
    Flux<Offer> findBySchoolId(UUID schoolId);
}
