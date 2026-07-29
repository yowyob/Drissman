package com.drissman.service;

import com.drissman.api.dto.EnrollmentViewDto;
import com.drissman.domain.entity.Enrollment;
import com.drissman.domain.entity.Offer;
import com.drissman.domain.entity.School;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.EnrollmentRepository;
import com.drissman.domain.repository.OfferRepository;
import com.drissman.domain.repository.SchoolRepository;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EnrollmentAppService {

    private final EnrollmentRepository enrollmentRepository;
    private final OfferRepository offerRepository;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final PaymentService paymentService;

    public Mono<EnrollmentViewDto> createEnrollment(UUID userId, UUID offerId) {
        Mono<User> userMono = userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable")));

        Mono<Offer> offerMono = offerRepository.findById(offerId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Offre introuvable")));

        return Mono.zip(userMono, offerMono)
                .flatMap(tuple -> {
                    User user = tuple.getT1();
                    Offer offer = tuple.getT2();

                    return enrollmentRepository.findByUserIdAndOfferId(userId, offerId)
                            .filter(existing -> existing.getStatus() == Enrollment.EnrollmentStatus.PENDING
                                    || existing.getStatus() == Enrollment.EnrollmentStatus.ACTIVE)
                            .hasElement()
                            .flatMap(exists -> {
                                if (exists) {
                                    return Mono.error(new ResponseStatusException(HttpStatus.CONFLICT,
                                            "Vous etes deja inscrit a cette offre"));
                                }

                                Mono<User> normalizedUserMono;
                                if (user.getRole() == User.Role.VISITOR) {
                                    user.setRole(User.Role.STUDENT);
                                    normalizedUserMono = userRepository.save(user);
                                } else {
                                    normalizedUserMono = Mono.just(user);
                                }

                                return normalizedUserMono.flatMap(savedUser -> {
                                    Enrollment enrollment = Enrollment.builder()
                                            .userId(savedUser.getId())
                                            .schoolId(offer.getSchoolId())
                                            .offerId(offer.getId())
                                            .trainingPeriodId(null)
                                            .enrolledAt(LocalDateTime.now())
                                            .status(Enrollment.EnrollmentStatus.PENDING)
                                            .hoursPurchased(offer.getHours() != null ? offer.getHours() : 0)
                                            .hoursConsumed(0)
                                            .createdAt(LocalDateTime.now())
                                            .build();

                                    return enrollmentRepository.save(enrollment)
                                            .flatMap(this::toViewDto);
                                });
                            });
                });
    }

    public Flux<EnrollmentViewDto> getEnrollmentsForStudent(UUID userId) {
        return enrollmentRepository.findByUserId(userId)
                .flatMap(this::toViewDto)
                .sort((a, b) -> b.getEnrolledAt().compareTo(a.getEnrolledAt()));
    }

    public Flux<EnrollmentViewDto> getEnrollmentsForSchool(UUID schoolId) {
        return enrollmentRepository.findBySchoolId(schoolId)
                .flatMap(this::toViewDto)
                .sort((a, b) -> b.getEnrolledAt().compareTo(a.getEnrolledAt()));
    }

    public Mono<EnrollmentViewDto> updateEnrollmentStatus(UUID schoolId, UUID enrollmentId, String statusRaw) {
        Enrollment.EnrollmentStatus nextStatus;
        try {
            nextStatus = Enrollment.EnrollmentStatus.valueOf(statusRaw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut invalide"));
        }

        return enrollmentRepository.findById(enrollmentId)
                .filter(enrollment -> schoolId.equals(enrollment.getSchoolId()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscription introuvable")))
                .flatMap(enrollment -> {
                    enrollment.setStatus(nextStatus);
                    return enrollmentRepository.save(enrollment);
                })
                // Pont paiement : activer/annuler l'inscription synchronise ses factures.
                .flatMap(saved -> paymentService.onEnrollmentStatusChanged(saved.getId(), nextStatus)
                        .thenReturn(saved))
                .flatMap(this::toViewDto);
    }

    private Mono<EnrollmentViewDto> toViewDto(Enrollment enrollment) {
        Mono<Offer> offerMono = offerRepository.findById(enrollment.getOfferId())
                .defaultIfEmpty(Offer.builder()
                        .id(enrollment.getOfferId())
                        .schoolId(enrollment.getSchoolId())
                        .name("Offre")
                        .price(0)
                        .hours(enrollment.getHoursPurchased())
                        .permitType("B")
                        .build());

        Mono<User> userMono = userRepository.findById(enrollment.getUserId())
                .defaultIfEmpty(User.builder()
                        .id(enrollment.getUserId())
                        .firstName("Eleve")
                        .lastName("Inconnu")
                        .build());

        Mono<School> schoolMono = schoolRepository.findById(enrollment.getSchoolId())
                .defaultIfEmpty(School.builder()
                        .id(enrollment.getSchoolId())
                        .name("Auto-ecole")
                        .build());

        return Mono.zip(offerMono, userMono, schoolMono)
                .map(tuple -> {
                    Offer offer = tuple.getT1();
                    User student = tuple.getT2();
                    School school = tuple.getT3();

                    return EnrollmentViewDto.builder()
                            .id(enrollment.getId())
                            .offerId(enrollment.getOfferId())
                            .offerName(offer.getName())
                            .price(offer.getPrice() != null ? offer.getPrice() : 0)
                            .hours(enrollment.getHoursPurchased() != null ? enrollment.getHoursPurchased() : 0)
                            .hoursConsumed(enrollment.getHoursConsumed() != null ? enrollment.getHoursConsumed() : 0)
                            .hoursRemaining((enrollment.getHoursPurchased() != null ? enrollment.getHoursPurchased() : 0) - (enrollment.getHoursConsumed() != null ? enrollment.getHoursConsumed() : 0))
                            .permitType(offer.getPermitType() != null ? offer.getPermitType() : "B")
                            .schoolId(enrollment.getSchoolId())
                            .schoolName(school.getName())
                            .studentId(enrollment.getUserId())
                            .studentName((student.getFirstName() != null ? student.getFirstName() : "") + " " +
                                    (student.getLastName() != null ? student.getLastName() : ""))
                            .status(enrollment.getStatus().name())
                            .enrolledAt(enrollment.getEnrolledAt())
                            .build();
                });
    }
}
