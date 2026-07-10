package com.drissman.service;

import com.drissman.api.dto.CreateTrainingPeriodRequest;
import com.drissman.api.dto.TrainingPeriodFormationDto;
import com.drissman.api.dto.TrainingPeriodViewDto;
import com.drissman.domain.entity.SessionOffer;
import com.drissman.domain.entity.TrainingPeriod;
import com.drissman.domain.repository.EnrollmentRepository;
import com.drissman.domain.repository.OfferRepository;
import com.drissman.domain.repository.SessionOfferRepository;
import com.drissman.domain.repository.TrainingPeriodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrainingPeriodService {

    private final TrainingPeriodRepository trainingPeriodRepository;
    private final SessionOfferRepository sessionOfferRepository;
    private final OfferRepository offerRepository;
    private final EnrollmentRepository enrollmentRepository;

    public Flux<TrainingPeriodViewDto> getBySchool(UUID schoolId) {
        return trainingPeriodRepository.findBySchoolId(schoolId)
                .flatMap(this::toViewDto)
                .sort((a, b) -> b.getStartDate().compareTo(a.getStartDate()));
    }

    public Flux<TrainingPeriodViewDto> getPublishedBySchool(UUID schoolId) {
        return trainingPeriodRepository.findBySchoolId(schoolId)
                .filter(period -> period.getStatus() == TrainingPeriod.TrainingPeriodStatus.PUBLISHED
                        || period.getStatus() == TrainingPeriod.TrainingPeriodStatus.IN_PROGRESS)
                .flatMap(this::toViewDto)
                .sort((a, b) -> b.getStartDate().compareTo(a.getStartDate()));
    }

    @Transactional
    public Mono<TrainingPeriodViewDto> create(UUID schoolId, CreateTrainingPeriodRequest request) {
        UUID primaryOfferId = resolvePrimaryOfferId(request);
        TrainingPeriod period = TrainingPeriod.builder()
                .schoolId(schoolId)
                .offerId(primaryOfferId)
                .name(request.getName())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .maxStudents(request.getMaxStudents() != null ? request.getMaxStudents() : 30)
                .status(TrainingPeriod.TrainingPeriodStatus.PUBLISHED)
                .enrollmentDeadline(request.getEnrollmentDeadline())
                .scheduleDescription(request.getScheduleDescription())
                .createdAt(LocalDateTime.now())
                .build();

        return trainingPeriodRepository.save(period)
                .flatMap(saved -> saveAdditionalOffers(saved.getId(), primaryOfferId, request.getOfferIds()).thenReturn(saved))
                .flatMap(this::toViewDto);
    }

    @Transactional
    public Mono<TrainingPeriodViewDto> updateStatus(UUID schoolId, UUID periodId, String statusRaw) {
        TrainingPeriod.TrainingPeriodStatus status;
        try {
            status = TrainingPeriod.TrainingPeriodStatus.valueOf(statusRaw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut invalide"));
        }

        return trainingPeriodRepository.findById(periodId)
                .filter(tp -> schoolId.equals(tp.getSchoolId()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Session introuvable")))
                .flatMap(tp -> {
                    tp.setStatus(status);
                    return trainingPeriodRepository.save(tp);
                })
                .flatMap(this::toViewDto);
    }

    @Transactional
    public Mono<Void> delete(UUID schoolId, UUID periodId) {
        return trainingPeriodRepository.findById(periodId)
                .filter(tp -> schoolId.equals(tp.getSchoolId()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Session introuvable")))
                .flatMap(tp -> sessionOfferRepository.deleteByTrainingPeriodId(tp.getId()).then(trainingPeriodRepository.delete(tp)));
    }

    private UUID resolvePrimaryOfferId(CreateTrainingPeriodRequest request) {
        if (request.getOfferId() != null) {
            return request.getOfferId();
        }
        if (request.getOfferIds() != null && !request.getOfferIds().isEmpty()) {
            return request.getOfferIds().get(0);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Au moins une offre est requise");
    }

    private Mono<Void> saveAdditionalOffers(UUID periodId, UUID primaryOfferId, List<UUID> offerIds) {
        if (offerIds == null || offerIds.isEmpty()) {
            return Mono.empty();
        }

        return Flux.fromIterable(offerIds)
                .distinct()
                .filter(offerId -> !offerId.equals(primaryOfferId))
                .flatMap(offerId -> sessionOfferRepository.save(SessionOffer.builder()
                        .trainingPeriodId(periodId)
                        .offerId(offerId)
                        .createdAt(LocalDateTime.now())
                        .build()))
                .then();
    }

    private Mono<TrainingPeriodViewDto> toViewDto(TrainingPeriod period) {
        Mono<List<TrainingPeriodFormationDto>> formationsMono = Flux.concat(
                Mono.justOrEmpty(period.getOfferId()),
                sessionOfferRepository.findByTrainingPeriodId(period.getId()).map(SessionOffer::getOfferId))
                .distinct()
                .flatMap(offerRepository::findById)
                .map(offer -> TrainingPeriodFormationDto.builder()
                        .offerId(offer.getId())
                        .offerName(offer.getName())
                        .permitType(offer.getPermitType())
                        .price(offer.getPrice())
                        .build())
                .collectList()
                .defaultIfEmpty(new ArrayList<>());

        Mono<Integer> enrolledMono = enrollmentRepository.countByTrainingPeriodId(period.getId())
                .map(Long::intValue)
                .defaultIfEmpty(0);

        return Mono.zip(formationsMono, enrolledMono)
                .map(tuple -> TrainingPeriodViewDto.builder()
                        .id(period.getId())
                        .name(period.getName())
                        .description(period.getDescription())
                        .startDate(period.getStartDate())
                        .endDate(period.getEndDate())
                        .enrollmentDeadline(period.getEnrollmentDeadline())
                        .maxStudents(period.getMaxStudents())
                        .status(period.getStatus() != null ? period.getStatus().name() : "DRAFT")
                        .totalEnrolled(tuple.getT2())
                        .formations(tuple.getT1())
                        .build());
    }
}
