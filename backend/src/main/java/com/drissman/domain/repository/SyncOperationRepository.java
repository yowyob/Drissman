package com.drissman.domain.repository;

import com.drissman.domain.entity.SyncOperation;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.util.UUID;

public interface SyncOperationRepository extends ReactiveCrudRepository<SyncOperation, UUID> {
}
