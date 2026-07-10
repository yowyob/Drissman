package com.drissman.domain.repository;

import com.drissman.domain.entity.Availability;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface AvailabilityRepository extends ReactiveCrudRepository<Availability, UUID> {
    Flux<Availability> findBySchoolId(UUID schoolId);

    Flux<Availability> findBySchoolIdAndDayOfWeek(UUID schoolId, Integer dayOfWeek);
}
