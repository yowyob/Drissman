package com.drissman.domain.repository;

import com.drissman.domain.entity.Session;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.time.LocalDate;
import java.util.UUID;

public interface SessionRepository extends ReactiveCrudRepository<Session, UUID> {
    Flux<Session> findByEnrollmentId(UUID enrollmentId);

    Flux<Session> findByMonitorId(UUID monitorId);

    Flux<Session> findByDateBetween(LocalDate startDate, LocalDate endDate);

    Flux<Session> findBySchoolId(UUID schoolId);

    /**
     * Séances de conduite (ou examen blanc) en cours pour un moniteur :
     * aujourd'hui, à l'heure actuelle (marge 15 min), non annulées.
     * Un module CODE ne donne PAS droit au partage de position.
     */
    @org.springframework.data.r2dbc.repository.Query("""
            SELECT COUNT(*) FROM sessions s
            LEFT JOIN modules mo ON s.module_id = mo.id
            WHERE s.monitor_id = :monitorId
              AND s.date = CURRENT_DATE
              AND CURRENT_TIME >= s.start_time - INTERVAL '15 minutes'
              AND CURRENT_TIME <= s.end_time + INTERVAL '15 minutes'
              AND s.status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS')
              AND (mo.category IS NULL OR mo.category IN ('CONDUITE', 'EXAMEN_BLANC'))
            """)
    reactor.core.publisher.Mono<Long> countActiveDrivingSessions(UUID monitorId);
}
