package com.drissman.domain.repository;

import com.drissman.domain.entity.Notification;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import java.util.UUID;

@Repository
public interface NotificationRepository extends ReactiveCrudRepository<Notification, UUID> {
    Flux<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
