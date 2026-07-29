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
import com.drissman.domain.entity.School;
import com.drissman.domain.entity.Session;
import com.drissman.domain.entity.SessionCourseOffer;
import com.drissman.domain.entity.SessionMonitor;
import com.drissman.domain.entity.TrainingPeriod;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.EnrollmentRepository;
import com.drissman.domain.repository.MonitorRepository;
import com.drissman.domain.repository.OfferRepository;
import com.drissman.domain.repository.SessionCourseOfferRepository;
import com.drissman.domain.repository.SessionOfferRepository;
import com.drissman.domain.repository.SessionRepository;
import com.drissman.domain.repository.SessionMonitorRepository;
import com.drissman.domain.repository.SchoolRepository;
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
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final MonitorRepository monitorRepository;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final OfferRepository offerRepository;
    private final TrainingPeriodRepository trainingPeriodRepository;
    private final SessionOfferRepository sessionOfferRepository;
    private final SessionCourseOfferRepository sessionCourseOfferRepository;
    private final SessionMonitorRepository sessionMonitorRepository;
    private final NotificationService notificationService;

    @Transactional
    public Mono<SessionDto> scheduleSession(UUID schoolId, CreateSessionRequest request) {
        return validateMonitorSchool(schoolId, request.getMonitorIds())
                .then(Mono.defer(() -> createSessionWithoutEnrollment(schoolId, request)))
                .flatMap(session -> Mono.when(
                        notifyStudents(schoolId, request, session),
                        notifyMonitors(schoolId, request, session)
                ).thenReturn(session));
    }

    private Mono<Void> notifyStudents(UUID schoolId, CreateSessionRequest request, SessionDto session) {
        if (request.getOfferIds() == null || request.getOfferIds().isEmpty()) {
            return Mono.empty();
        }
        return Flux.fromIterable(request.getOfferIds())
                .flatMap(offerId -> enrollmentRepository.findBySchoolId(schoolId)
                        .filter(e -> offerId.equals(e.getOfferId()))
                        .filter(e -> e.getStatus() == Enrollment.EnrollmentStatus.ACTIVE || e.getStatus() == Enrollment.EnrollmentStatus.PENDING)
                )
                .map(Enrollment::getUserId)
                .distinct()
                .flatMap(userId -> notificationService.createNotification(
                        userId,
                        "Nouvelle séance de conduite !",
                        "Une nouvelle séance a été planifiée le " + session.getDate() + " de " + session.getStartTime() + " à " + session.getEndTime() + ".",
                        "course"
                ))
                .then();
    }

    private Mono<Void> notifyMonitors(UUID schoolId, CreateSessionRequest request, SessionDto session) {
        if (request.getMonitorIds() == null || request.getMonitorIds().isEmpty()) {
            return Mono.empty();
        }
        return Flux.fromIterable(request.getMonitorIds())
                .flatMap(monitorRepository::findById)
                .filter(monitor -> monitor.getUserId() != null)
                .map(Monitor::getUserId)
                .distinct()
                .flatMap(userId -> notificationService.createNotification(
                        userId,
                        "Nouvelle séance assignée !",
                        "Une nouvelle séance de conduite vous a été assignée pour le " + session.getDate() + " de " + session.getStartTime() + " à " + session.getEndTime() + ".",
                        "course"
                ))
                .then();
    }

    /** Toutes les séances de l'école, quel que soit leur statut (planning gérant). */
    public Flux<SessionDto> getSessionsForSchool(UUID schoolId) {
        return sessionRepository.findBySchoolId(schoolId).flatMap(this::mapToDtoWithOffers);
    }

    public Flux<SessionDto> getSessionsForEnrollment(UUID schoolId, UUID enrollmentId) {
        return enrollmentRepository.findById(enrollmentId)
                .filter(enrollment -> schoolId.equals(enrollment.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Inscription introuvable pour cette auto-ecole")))
                .flatMapMany(enrollment -> 
                    // Trouve les sessions liées à l'offre de l'inscription OU directement à l'inscription (legacy)
                    Flux.concat(
                        sessionRepository.findByEnrollmentId(enrollmentId),
                        sessionCourseOfferRepository.findByOfferId(enrollment.getOfferId())
                            .flatMap(sco -> sessionRepository.findById(sco.getSessionId()))
                    ).distinct(Session::getId)
                )
                .flatMap(this::mapToDtoWithOffers);
    }

    public Flux<SessionDto> getSessionsForMonitor(UUID schoolId, UUID monitorId) {
        return monitorRepository.findById(monitorId)
                .filter(monitor -> schoolId.equals(monitor.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Moniteur introuvable pour cette auto-ecole")))
                .thenMany(sessionMonitorRepository.findByMonitorId(monitorId).flatMap(sm -> sessionRepository.findById(sm.getSessionId())))
                .flatMap(this::mapToDtoWithOffers);
    }

    public Mono<SessionDto> getSessionById(UUID id) {
        return sessionRepository.findById(id).flatMap(this::mapToDtoWithOffers);
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
                        .then(Mono.defer(() -> {
                            session.setStatus(Session.SessionStatus.COMPLETED);
                            session.setUpdatedAt(java.time.LocalDateTime.now());
                            if (pedagogicalNotes != null) {
                                session.setPedagogicalNotes(pedagogicalNotes);
                            }
                            
                            // Mettre à jour l'inscription si une inscription spécifique est liée (legacy)
                            if (session.getEnrollmentId() != null) {
                                return enrollmentRepository.findById(session.getEnrollmentId())
                                    .flatMap(enrollment -> {
                                        enrollment.setHoursConsumed((enrollment.getHoursConsumed() != null ? enrollment.getHoursConsumed() : 0) + session.getDurationHours());
                                        return enrollmentRepository.save(enrollment);
                                    }).then(sessionRepository.save(session));
                            } else {
                                return sessionCourseOfferRepository.findBySessionId(session.getId())
                                    .flatMap(sco -> enrollmentRepository.findBySchoolId(session.getSchoolId())
                                            .filter(e -> sco.getOfferId().equals(e.getOfferId()))
                                            .filter(e -> e.getStatus() == Enrollment.EnrollmentStatus.ACTIVE || e.getStatus() == Enrollment.EnrollmentStatus.PENDING)
                                    )
                                    .flatMap(enrollment -> {
                                        enrollment.setHoursConsumed((enrollment.getHoursConsumed() != null ? enrollment.getHoursConsumed() : 0) + session.getDurationHours());
                                        return enrollmentRepository.save(enrollment);
                                    })
                                    .then(sessionRepository.save(session));
                            }
                        })))
                        .flatMap(this::mapToDtoWithOffers);
    }

    public Flux<MonitorSessionViewDto> getMonitorSessionsByUserId(UUID userId) {
        return monitorRepository.findByUserId(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("Profil moniteur introuvable")))
                .flatMapMany(monitor -> sessionMonitorRepository.findByMonitorId(monitor.getId())
                        .flatMap(sm -> sessionRepository.findById(sm.getSessionId()))
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
                        .flatMap(session -> sessionMonitorRepository.findBySessionId(session.getId())
                                .filter(sm -> monitor.getId().equals(sm.getMonitorId()))
                                .next()
                                .switchIfEmpty(Mono.error(new RuntimeException("Session non assignee a ce moniteur")))
                                .flatMap(sm -> completeSession(monitor.getSchoolId(), session.getId(), pedagogicalNotes))));
    }

    public Flux<MonitorStudentProgressDto> getStudentsForMonitor(UUID userId) {
        return monitorRepository.findByUserId(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("Profil moniteur introuvable")))
                .flatMapMany(monitor -> 
                    // Students from direct legacy sessions OR from offers assigned to this monitor
                    Flux.concat(
                        sessionMonitorRepository.findByMonitorId(monitor.getId())
                            .flatMap(sm -> sessionRepository.findById(sm.getSessionId()))
                            .filter(session -> session.getEnrollmentId() != null)
                            .map(Session::getEnrollmentId),
                        // Find offers for this monitor, then enrollments for those offers
                        offerRepository.findBySchoolId(monitor.getSchoolId())
                            .flatMap(offer -> enrollmentRepository.findBySchoolId(monitor.getSchoolId())
                                .filter(e -> offer.getId().equals(e.getOfferId()))
                                .filter(e -> e.getId() != null)
                                .map(Enrollment::getId)
                            )
                    )
                    .filter(id -> id != null)
                    .distinct()
                    .flatMap(enrollmentRepository::findById)
                    .flatMap(this::toMonitorStudentProgress)
                );
    }

    public Flux<MonitorStudentProgressDto> getSessionStudents(UUID sessionId) {
        return sessionRepository.findById(sessionId)
            .flatMapMany(session -> {
                if (session.getEnrollmentId() != null) {
                    return enrollmentRepository.findById(session.getEnrollmentId()).flux();
                } else {
                    return sessionCourseOfferRepository.findBySessionId(sessionId)
                        .flatMap(sco -> enrollmentRepository.findBySchoolId(session.getSchoolId())
                            .filter(e -> sco.getOfferId().equals(e.getOfferId()))
                            .filter(e -> e.getStatus() == Enrollment.EnrollmentStatus.ACTIVE || e.getStatus() == Enrollment.EnrollmentStatus.PENDING)
                        );
                }
            })
            .flatMap(this::toMonitorStudentProgress);
    }

    public Flux<CandidateSessionViewDto> getSessionsForStudent(UUID userId) {
        return enrollmentRepository.findByUserId(userId)
                .flatMap(enrollment -> 
                    Flux.concat(
                        sessionRepository.findByEnrollmentId(enrollment.getId()),
                        sessionCourseOfferRepository.findByOfferId(enrollment.getOfferId())
                            .flatMap(sco -> sessionRepository.findById(sco.getSessionId()))
                    )
                    .distinct(Session::getId)
                    .flatMap(session -> toCandidateSessionView(session, enrollment))
                )
                .sort((a, b) -> {
                    int byDate = b.getDate().compareTo(a.getDate());
                    if (byDate != 0) {
                        return byDate;
                    }
                    return b.getStartTime().compareTo(a.getStartTime());
                });
    }

    private Mono<Void> validateMonitorSchool(UUID schoolId, List<UUID> monitorIds) {
        if (monitorIds == null || monitorIds.isEmpty()) {
            return Mono.empty();
        }
        return Flux.fromIterable(monitorIds)
                .flatMap(monitorId -> monitorRepository.findById(monitorId)
                        .filter(monitor -> schoolId.equals(monitor.getSchoolId()))
                        .switchIfEmpty(Mono.error(new RuntimeException("Moniteur invalide pour cette auto-ecole")))
                ).then();
    }

    private Mono<Void> ensureSessionBelongsToSchool(Session session, UUID schoolId) {
        if (schoolId.equals(session.getSchoolId())) {
            return Mono.empty();
        }
        return Mono.error(new RuntimeException("Session hors perimetre auto-ecole"));
    }

    private Mono<SessionDto> createSessionWithoutEnrollment(UUID schoolId, CreateSessionRequest request) {
        Session session = Session.builder()
                .schoolId(schoolId)
                .moduleId(request.getModuleId())
                .lessonId(request.getLessonId())
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .meetingPoint(request.getMeetingPoint())
                .status(Session.SessionStatus.SCHEDULED)
                .createdAt(LocalDateTime.now())
                .build();

        return sessionRepository.save(session)
                .flatMap(savedSession -> {
                    Mono<Void> saveOffers = (request.getOfferIds() != null && !request.getOfferIds().isEmpty()) 
                        ? Flux.fromIterable(request.getOfferIds())
                            .map(offerId -> SessionCourseOffer.builder()
                                .sessionId(savedSession.getId())
                                .offerId(offerId)
                                .createdAt(LocalDateTime.now())
                                .build())
                            .flatMap(sessionCourseOfferRepository::save)
                            .then()
                        : Mono.empty();

                    Mono<Void> saveMonitors = (request.getMonitorIds() != null && !request.getMonitorIds().isEmpty())
                        ? Flux.fromIterable(request.getMonitorIds())
                            .map(monitorId -> SessionMonitor.builder()
                                .sessionId(savedSession.getId())
                                .monitorId(monitorId)
                                .createdAt(LocalDateTime.now())
                                .build())
                            .flatMap(sessionMonitorRepository::save)
                            .then()
                        : Mono.empty();

                    return Mono.when(saveOffers, saveMonitors)
                               .then(Mono.defer(() -> mapToDtoWithOffers(savedSession)));
                });
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
        // Find main offer name from session course offers
        Mono<String> offerNameMono = sessionCourseOfferRepository.findBySessionId(session.getId())
            .next()
            .flatMap(sco -> offerRepository.findById(sco.getOfferId()))
            .map(Offer::getName)
            .defaultIfEmpty("Groupe");

        // Use enrollment if exists (legacy), otherwise studentName is "Classe Collective"
        Mono<Enrollment> enrollmentMono = session.getEnrollmentId() != null 
            ? enrollmentRepository.findById(session.getEnrollmentId()) 
            : Mono.empty();

        return Mono.zip(offerNameMono, enrollmentMono.map(e -> e).defaultIfEmpty(new Enrollment()))
            .flatMap(tuple -> {
                String offerName = tuple.getT1();
                Enrollment enrollment = tuple.getT2();
                
                if (enrollment.getId() != null) {
                    return userRepository.findById(enrollment.getUserId())
                        .map(student -> MonitorSessionViewDto.builder()
                            .sessionId(session.getId())
                            .enrollmentId(enrollment.getId())
                            .studentId(student.getId())
                            .studentName((safe(student.getFirstName()) + " " + safe(student.getLastName())).trim())
                            .offerId(enrollment.getOfferId())
                            .offerName(offerName)
                            .date(session.getDate())
                            .startTime(session.getStartTime())
                            .endTime(session.getEndTime())
                            .meetingPoint(session.getMeetingPoint())
                            .pedagogicalNotes(session.getPedagogicalNotes())
                            .status(session.getStatus())
                            .durationHours(session.getDurationHours())
                            .build());
                } else {
                    return Mono.just(MonitorSessionViewDto.builder()
                        .sessionId(session.getId())
                        .enrollmentId(null)
                        .studentId(null)
                        .studentName("Classe collective")
                        .offerId(null)
                        .offerName(offerName)
                        .date(session.getDate())
                        .startTime(session.getStartTime())
                        .endTime(session.getEndTime())
                        .meetingPoint(session.getMeetingPoint())
                        .pedagogicalNotes(session.getPedagogicalNotes())
                        .status(session.getStatus())
                        .durationHours(session.getDurationHours())
                        .build());
                }
            });
    }

    private Mono<MonitorStudentProgressDto> toMonitorStudentProgress(Enrollment enrollment) {
        if (enrollment == null) return Mono.empty();

        Mono<User> userMono = enrollment.getUserId() != null
                ? userRepository.findById(enrollment.getUserId())
                    .defaultIfEmpty(User.builder().id(enrollment.getUserId()).firstName("Élève").lastName("Inconnu").build())
                : Mono.just(User.builder().firstName("Élève").lastName("Inconnu").build());

        Mono<Offer> offerMono = enrollment.getOfferId() != null
                ? offerRepository.findById(enrollment.getOfferId())
                    .defaultIfEmpty(Offer.builder().id(enrollment.getOfferId()).name("Offre").build())
                : Mono.just(Offer.builder().name("Offre").build());

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
                            .status(enrollment.getStatus() != null ? enrollment.getStatus().name() : "ACTIVE")
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

        Mono<String> monitorNameMono = sessionMonitorRepository.findBySessionId(session.getId())
                .flatMap(sm -> monitorRepository.findById(sm.getMonitorId()))
                .flatMap(monitor -> monitor.getUserId() != null
                        ? userRepository.findById(monitor.getUserId())
                                .map(user -> (safe(user.getFirstName()) + " " + safe(user.getLastName())).trim())
                        : Mono.just((safe(monitor.getFirstName()) + " " + safe(monitor.getLastName())).trim()))
                .collectList()
                .map(names -> names.isEmpty() ? "Non assigne" : String.join(", ", names));

        Mono<String> schoolNameMono = schoolRepository.findById(enrollment.getSchoolId())
                .map(School::getName)
                .defaultIfEmpty("Auto-école");

        return Mono.zip(offerMono, monitorNameMono, schoolNameMono)
                .map(tuple -> CandidateSessionViewDto.builder()
                        .sessionId(session.getId())
                        .enrollmentId(enrollment.getId())
                        .offerId(enrollment.getOfferId())
                        .offerName(tuple.getT1().getName())
                        .monitorName(tuple.getT2())
                        .schoolName(tuple.getT3())
                        .date(session.getDate())
                        .startTime(session.getStartTime())
                        .endTime(session.getEndTime())
                        .meetingPoint(session.getMeetingPoint())
                        .status(session.getStatus())
                        .durationHours(session.getDurationHours())
                        .build());
    }

    private Mono<SessionDto> mapToDtoWithOffers(Session session) {
        Mono<List<UUID>> offerIdsMono = sessionCourseOfferRepository.findBySessionId(session.getId())
            .map(SessionCourseOffer::getOfferId)
            .collectList();
            
        Mono<List<UUID>> monitorIdsMono = sessionMonitorRepository.findBySessionId(session.getId())
            .map(SessionMonitor::getMonitorId)
            .collectList();

        return Mono.zip(offerIdsMono, monitorIdsMono)
            .map(tuple -> SessionDto.builder()
                .id(session.getId())
                .offerIds(tuple.getT1())
                .monitorIds(tuple.getT2())
                .moduleId(session.getModuleId())
                .lessonId(session.getLessonId())
                .date(session.getDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus())
                .meetingPoint(session.getMeetingPoint())
                .pedagogicalNotes(session.getPedagogicalNotes())
                .durationHours(session.getDurationHours())
                .build());
    }
}
