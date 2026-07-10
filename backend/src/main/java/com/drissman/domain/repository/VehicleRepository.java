package com.drissman.domain.repository;

import com.drissman.domain.entity.Vehicle;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface VehicleRepository extends ReactiveCrudRepository<Vehicle, UUID> {

    Flux<Vehicle> findBySchoolId(UUID schoolId);

    Flux<Vehicle> findBySchoolIdAndIsActiveTrue(UUID schoolId);
}
