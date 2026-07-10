package com.drissman.domain.repository;

import com.drissman.domain.entity.TrainingPeriod;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface TrainingPeriodRepository extends ReactiveCrudRepository<TrainingPeriod, UUID> {

    Flux<TrainingPeriod> findBySchoolId(UUID schoolId);

    Flux<TrainingPeriod> findByStatus(TrainingPeriod.TrainingPeriodStatus status);

    Flux<TrainingPeriod> findBySchoolIdAndStatus(UUID schoolId, TrainingPeriod.TrainingPeriodStatus status);

    Mono<Long> countBySchoolId(UUID schoolId);
}
