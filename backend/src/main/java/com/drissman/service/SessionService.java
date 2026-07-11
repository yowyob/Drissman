package com.drissman.service;

import com.drissman.api.dto.CreateSessionRequest;
import com.drissman.api.dto.AvailableOfferDto;
import com.drissman.api.dto.CandidateSessionViewDto;
import com.drissman.api.dto.MonitorSessionViewDto;
import com.drissman.api.dto.MonitorStudentProgressDto;
import com.drissman.api.dto.SessionEnrollmentOptionDto;
import com.drissman.api.dto.SessionDto;
import com.drissman.domain.entity.Enrollment;
import com.drissman.domain.entity.Offer;
import com.drissman.domain.entity.Monitor;
import com.drissman.domain.entity.Session;
import com.drissman.domain.entity.TrainingPeriod;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.EnrollmentRepository;
import com.drissman.domain.repository.MonitorRepository;
import com.drissman.domain.repository.OfferRepository;
import com.drissman.domain.repository.SessionOfferRepository;
import com.drissman.domain.repository.SessionRepository;
import com.drissman.domain.repository.TrainingPeriodRepository;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final MonitorRepository monitorRepository;
    private final UserRepository userRepository;
    private final OfferRepository offerRepository;
    private final TrainingPeriodRepository trainingPeriodRepository;
    private final SessionOfferRepository sessionOfferRepository;

    @Transactional
    public Mono<SessionDto> scheduleSession(UUID schoolId, CreateSessionRequest request) {
        return enrollmentRepository.findById(request.getEnrollmentId())
                .filter(enrollment -> schoolId.equals(enrollment.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Inscription introuvable pour cette auto-ecole")))
                .flatMap(enrollment -> validateMonitorSchool(schoolId, request.getMonitorId())
                        .then(Mono.defer(() -> createSession(enrollment, request))));
    }

    /** Toutes les séances de l'école, quel que soit leur statut (planning gérant). */
    public Flux<SessionDto> getSessionsForSchool(UUID schoolId) {
        return sessionRepository.findBySchoolId(schoolId).map(this::mapToDto);
    }

    public Flux<SessionDto> getSessionsForEnrollment(UUID schoolId, UUID enrollmentId) {
        return enrollmentRepository.findById(enrollmentId)
                .filter(enrollment -> schoolId.equals(enrollment.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Inscription introuvable pour cette auto-ecole")))
                .thenMany(sessionRepository.findByEnrollmentId(enrollmentId))
                .map(this::mapToDto);
    }

    public Flux<SessionDto> getSessionsForMonitor(UUID schoolId, UUID monitorId) {
        return monitorRepository.findById(monitorId)
                .filter(monitor -> schoolId.equals(monitor.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Moniteur introuvable pour cette auto-ecole")))
                .thenMany(sessionRepository.findByMonitorId(monitorId))
                .map(this::mapToDto);
    }

    public Mono<SessionDto> getSessionById(UUID id) {
        return sessionRepository.findById(id).map(this::mapToDto);
    }

    public Flux<AvailableOfferDto> getAvailableOffersForDate(UUID schoolId, LocalDate date) {
        return trainingPeriodRepository.findBySchoolId(schoolId)
                .filter(period -> isDateInPeriod(period, date))
                .filter(period -> period.getStatus() == TrainingPeriod.TrainingPeriodStatus.DRAFT
                        || period.getStatus() == TrainingPeriod.TrainingPeriodStatus.PUBLISHED
                        || period.getStatus() == TrainingPeriod.TrainingPeriodStatus.IN_PROGRESS)
                .flatMap(period -> Flux.concat(
                        Mono.justOrEmpty(period.getOfferId()),
                        sessionOfferRepository.findByTrainingPeriodId(period.getId()).map(so -> so.getOfferId())))
                .distinct()
                .flatMap(offerRepository::findById)
                .filter(offer -> schoolId.equals(offer.getSchoolId()))
                .map(this::mapOfferToAvailableDto);
    }

    public Flux<SessionEnrollmentOptionDto> getAvailableEnrollments(UUID schoolId, UUID offerId, LocalDate date) {
        return enrollmentRepository.findBySchoolId(schoolId)
                .filter(enrollment -> offerId.equals(enrollment.getOfferId()))
                .filter(enrollment -> enrollment.getStatus() == Enrollment.EnrollmentStatus.ACTIVE
                        || enrollment.getStatus() == Enrollment.EnrollmentStatus.PENDING)
                .flatMap(enrollment -> isEnrollmentValidForDate(enrollment, date)
                        .filter(Boolean::booleanValue)
                        .flatMap(valid -> userRepository.findById(enrollment.getUserId())
                                .map(user -> SessionEnrollmentOptionDto.builder()
                                        .enrollmentId(enrollment.getId())
                                        .studentId(user.getId())
                                        .studentName((safe(user.getFirstName()) + " " + safe(user.getLastName())).trim())
                                        .status(enrollment.getStatus().name())
                                        .hoursPurchased(enrollment.getHoursPurchased())
                                        .hoursConsumed(enrollment.getHoursConsumed())
                                        .build())))
                .sort((a, b) -> a.getStudentName().compareToIgnoreCase(b.getStudentName()));
    }

    public Mono<Void> cancelSession(UUID schoolId, UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.error(new RuntimeException("Session introuvable")))
                .flatMap(session -> ensureSessionBelongsToSchool(session, schoolId)
                        .then(Mono.defer(() -> {
                            session.setStatus(Session.SessionStatus.CANCELLED);
                            return sessionRepository.save(session).then();
                        })));
    }

    @Transactional
    public Mono<SessionDto> completeSession(UUID schoolId, UUID sessionId, String pedagogicalNotes) {
        return sessionRepository.findById(sessionId)
                .switchIfEmpty(Mono.error(new RuntimeException("Session introuvable")))
                .flatMap(session -> ensureSessionBelongsToSchool(session, schoolId)
                        .then(enrollmentRepository.findById(session.getEnrollmentId())
                                .flatMap(enrollment -> {
                                    session.setStatus(Session.SessionStatus.COMPLETED);
                                    session.setUpdatedAt(java.time.LocalDateTime.now());
                                    if (pedagogicalNotes != null) {
                                        session.setPedagogicalNotes(pedagogicalNotes);
                                    }

                                    enrollment.setHoursConsumed(enrollment.getHoursConsumed() + session.getDurationHours());

                                    return enrollmentRepository.save(enrollment)
                                            .then(sessionRepository.save(session))
                                            .map(this::mapToDto);
                                })));
    }

    public Flux<MonitorSessionViewDto> getMonitorSessionsByUserId(UUID userId) {
        return monitorRepository.findByUserId(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("Profil moniteur introuvable")))
                .flatMapMany(monitor -> sessionRepository.findByMonitorId(monitor.getId())
                        .flatMap(this::toMonitorSessionView)
                        .sort((a, b) -> {
                            int byDate = b.getDate().compareTo(a.getDate());
                            if (byDate != 0) {
                                return byDate;
                            }
                            return b.getStartTime().compareTo(a.getStartTime());
                        }));
    }

    @Transactional
    public Mono<SessionDto> completeSessionByMonitor(UUID userId, UUID sessionId, String pedagogicalNotes) {
        return monitorRepository.findByUserId(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("Profil moniteur introuvable")))
                .flatMap(monitor -> sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new RuntimeException("Session introuvable")))
                        .filter(session -> monitor.getId().equals(session.getMonitorId()))
                        .switchIfEmpty(Mono.error(new RuntimeException("Session non assignee a ce moniteur")))
                        .flatMap(session -> completeSession(monitor.getSchoolId(), session.getId(), pedagogicalNotes)));
    }

    public Flux<MonitorStudentProgressDto> getStudentsForMonitor(UUID userId) {
        return monitorRepository.findByUserId(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("Profil moniteur introuvable")))
                .flatMapMany(monitor -> sessionRepository.findByMonitorId(monitor.getId())
                        .map(Session::getEnrollmentId)
                        .distinct()
                        .flatMap(enrollmentRepository::findById)
                        .flatMap(this::toMonitorStudentProgress));
    }

    public Flux<CandidateSessionViewDto> getSessionsForStudent(UUID userId) {
        return enrollmentRepository.findByUserId(userId)
                .flatMap(enrollment -> sessionRepository.findByEnrollmentId(enrollment.getId())
                        .flatMap(session -> toCandidateSessionView(session, enrollment)))
                .sort((a, b) -> {
                    int byDate = b.getDate().compareTo(a.getDate());
                    if (byDate != 0) {
                        return byDate;
                    }
                    return b.getStartTime().compareTo(a.getStartTime());
                });
    }

    private Mono<Void> validateMonitorSchool(UUID schoolId, UUID monitorId) {
        if (monitorId == null) {
            return Mono.empty();
        }
        return monitorRepository.findById(monitorId)
                .filter(monitor -> schoolId.equals(monitor.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Moniteur invalide pour cette auto-ecole")))
                .then();
    }

    private Mono<Void> ensureSessionBelongsToSchool(Session session, UUID schoolId) {
        return enrollmentRepository.findById(session.getEnrollmentId())
                .filter(enrollment -> schoolId.equals(enrollment.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Session hors perimetre auto-ecole")))
                .then();
    }

    private Mono<SessionDto> createSession(Enrollment enrollment, CreateSessionRequest request) {
        Session session = Session.builder()
                .enrollmentId(enrollment.getId())
                .monitorId(request.getMonitorId())
                .moduleId(request.getModuleId())
                .lessonId(request.getLessonId())
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .meetingPoint(request.getMeetingPoint())
                .status(Session.SessionStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        int duration = session.getDurationHours();
        if (enrollment.getRemainingHours() < duration) {
            return Mono.error(new RuntimeException("Pas assez d'heures restantes sur l'inscription"));
        }

        return sessionRepository.save(session).map(this::mapToDto);
    }

    private boolean isDateInPeriod(TrainingPeriod period, LocalDate date) {
        if (period.getStartDate() == null || period.getEndDate() == null) {
            return false;
        }
        return !date.isBefore(period.getStartDate()) && !date.isAfter(period.getEndDate());
    }

    private Mono<Boolean> isEnrollmentValidForDate(Enrollment enrollment, LocalDate date) {
        if (enrollment.getTrainingPeriodId() == null) {
            return Mono.just(true);
        }

        return trainingPeriodRepository.findById(enrollment.getTrainingPeriodId())
                .map(period -> isDateInPeriod(period, date))
                .defaultIfEmpty(false);
    }

    private Mono<MonitorSessionViewDto> toMonitorSessionView(Session session) {
        Mono<Enrollment> enrollmentMono = enrollmentRepository.findById(session.getEnrollmentId());

        return enrollmentMono.flatMap(enrollment -> {
            Mono<User> userMono = userRepository.findById(enrollment.getUserId());
            Mono<Offer> offerMono = offerRepository.findById(enrollment.getOfferId());

            return Mono.zip(userMono, offerMono)
                    .map(tuple -> {
                        User student = tuple.getT1();
                        Offer offer = tuple.getT2();
                        return MonitorSessionViewDto.builder()
                                .sessionId(session.getId())
                                .enrollmentId(enrollment.getId())
                                .studentId(student.getId())
                                .studentName((safe(student.getFirstName()) + " " + safe(student.getLastName())).trim())
                                .offerId(offer.getId())
                                .offerName(offer.getName())
                                .date(session.getDate())
                                .startTime(session.getStartTime())
                                .endTime(session.getEndTime())
                                .meetingPoint(session.getMeetingPoint())
                                .pedagogicalNotes(session.getPedagogicalNotes())
                                .status(session.getStatus())
                                .durationHours(session.getDurationHours())
                                .build();
                    });
        });
    }

    private Mono<MonitorStudentProgressDto> toMonitorStudentProgress(Enrollment enrollment) {
        Mono<User> userMono = userRepository.findById(enrollment.getUserId());
        Mono<Offer> offerMono = offerRepository.findById(enrollment.getOfferId());

        return Mono.zip(userMono, offerMono)
                .map(tuple -> {
                    User student = tuple.getT1();
                    Offer offer = tuple.getT2();
                    Integer consumed = enrollment.getHoursConsumed() != null ? enrollment.getHoursConsumed() : 0;
                    Integer purchased = enrollment.getHoursPurchased() != null ? enrollment.getHoursPurchased() : 0;
                    Integer remaining = Math.max(0, purchased - consumed);

                    return MonitorStudentProgressDto.builder()
                            .enrollmentId(enrollment.getId())
                            .studentId(student.getId())
                            .studentName((safe(student.getFirstName()) + " " + safe(student.getLastName())).trim())
                            .offerId(offer.getId())
                            .offerName(offer.getName())
                            .hoursPurchased(purchased)
                            .hoursConsumed(consumed)
                            .hoursRemaining(remaining)
                            .status(enrollment.getStatus().name())
                            .build();
                });
    }

    private AvailableOfferDto mapOfferToAvailableDto(Offer offer) {
        return AvailableOfferDto.builder()
                .offerId(offer.getId())
                .offerName(offer.getName())
                .permitType(offer.getPermitType() != null ? offer.getPermitType().toUpperCase(Locale.ROOT) : "B")
                .price(offer.getPrice())
                .build();
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private Mono<CandidateSessionViewDto> toCandidateSessionView(Session session, Enrollment enrollment) {
        Mono<Offer> offerMono = offerRepository.findById(enrollment.getOfferId())
                .defaultIfEmpty(Offer.builder()
                        .id(enrollment.getOfferId())
                        .name("Offre")
                        .permitType("B")
                        .build());

        Mono<String> monitorNameMono = Mono.just("Non assigne");
        if (session.getMonitorId() != null) {
            monitorNameMono = monitorRepository.findById(session.getMonitorId())
                    .flatMap(monitor -> monitor.getUserId() != null
                            ? userRepository.findById(monitor.getUserId())
                                    .map(user -> (safe(user.getFirstName()) + " " + safe(user.getLastName())).trim())
                            : Mono.just((safe(monitor.getFirstName()) + " " + safe(monitor.getLastName())).trim()))
                    .defaultIfEmpty("Non assigne");
        }

        return Mono.zip(offerMono, monitorNameMono)
                .map(tuple -> CandidateSessionViewDto.builder()
                        .sessionId(session.getId())
                        .enrollmentId(enrollment.getId())
                        .offerId(enrollment.getOfferId())
                        .offerName(tuple.getT1().getName())
                        .monitorName(tuple.getT2())
                        .date(session.getDate())
                        .startTime(session.getStartTime())
                        .endTime(session.getEndTime())
                        .meetingPoint(session.getMeetingPoint())
                        .status(session.getStatus())
                        .durationHours(session.getDurationHours())
                        .build());
    }

    private SessionDto mapToDto(Session session) {
        return SessionDto.builder()
                .id(session.getId())
                .enrollmentId(session.getEnrollmentId())
                .monitorId(session.getMonitorId())
                .moduleId(session.getModuleId())
                .lessonId(session.getLessonId())
                .date(session.getDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus())
                .meetingPoint(session.getMeetingPoint())
                .pedagogicalNotes(session.getPedagogicalNotes())
                .durationHours(session.getDurationHours())
                .build();
    }
}
