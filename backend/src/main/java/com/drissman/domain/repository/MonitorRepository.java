package com.drissman.domain.repository;

import com.drissman.domain.entity.Monitor;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface MonitorRepository extends ReactiveCrudRepository<Monitor, UUID> {

    Flux<Monitor> findBySchoolId(UUID schoolId);

    Flux<Monitor> findBySchoolIdAndStatus(UUID schoolId, Monitor.MonitorStatus status);

    Mono<Boolean> existsByLicenseNumber(String licenseNumber);

    Mono<Monitor> findByUserId(UUID userId);
}
