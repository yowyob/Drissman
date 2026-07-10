package com.drissman.domain.repository;

import com.drissman.domain.entity.LessonRegistration;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public interface LessonRegistrationRepository extends R2dbcRepository<LessonRegistration, UUID> {
    Flux<LessonRegistration> findByLessonId(UUID lessonId);

    Flux<LessonRegistration> findByStudentId(UUID studentId);

    Mono<Boolean> existsByLessonIdAndStudentId(UUID lessonId, UUID studentId);

    Mono<Long> countByLessonId(UUID lessonId);

    Mono<Void> deleteByLessonIdAndStudentId(UUID lessonId, UUID studentId);
}
