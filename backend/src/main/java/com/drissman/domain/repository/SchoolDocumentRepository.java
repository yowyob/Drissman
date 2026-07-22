package com.drissman.domain.repository;

import com.drissman.domain.entity.SchoolDocument;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface SchoolDocumentRepository extends ReactiveCrudRepository<SchoolDocument, UUID> {

    Flux<SchoolDocument> findBySchoolId(UUID schoolId);
}
