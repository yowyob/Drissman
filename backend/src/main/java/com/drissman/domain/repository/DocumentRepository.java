package com.drissman.domain.repository;

import com.drissman.domain.entity.Document;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface DocumentRepository extends ReactiveCrudRepository<Document, UUID> {
    Flux<Document> findBySchoolId(UUID schoolId);
    Flux<Document> findByEnrollmentId(UUID enrollmentId);
}
