package com.drissman.domain.repository;

import com.drissman.domain.entity.Lesson;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface LessonRepository extends R2dbcRepository<Lesson, UUID> {
    Flux<Lesson> findBySchoolId(UUID schoolId);

    Flux<Lesson> findBySchoolIdAndDateBetween(UUID schoolId, LocalDate startDate, LocalDate endDate);

    Flux<Lesson> findByMonitorId(UUID monitorId);

    Flux<Lesson> findByTrainingPeriodId(UUID trainingPeriodId);
}
