package com.drissman.domain.repository;

import com.drissman.domain.entity.SessionMonitor;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface SessionMonitorRepository extends ReactiveCrudRepository<SessionMonitor, UUID> {
    Flux<SessionMonitor> findBySessionId(UUID sessionId);
    Flux<SessionMonitor> findByMonitorId(UUID monitorId);
}
