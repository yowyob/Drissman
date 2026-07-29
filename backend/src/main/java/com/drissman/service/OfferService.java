package com.drissman.service;

import com.drissman.api.dto.CreateOfferRequest;
import com.drissman.api.dto.SchoolDto;
import com.drissman.api.dto.UpdateOfferRequest;
import com.drissman.domain.entity.Offer;
import com.drissman.domain.entity.OfferMonitor;
import com.drissman.domain.repository.OfferMonitorRepository;
import com.drissman.domain.repository.OfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferRepository offerRepository;
    private final OfferMonitorRepository offerMonitorRepository;

    @Transactional
    public Mono<SchoolDto.OfferDto> create(UUID schoolId, CreateOfferRequest request) {
        Offer offer = Offer.builder()
                .schoolId(schoolId)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .hours(request.getHours())
                .permitType(request.getPermitType())
                .imageUrl(request.getImageUrl())
                .build();

        return offerRepository.save(offer)
                .flatMap(savedOffer -> {
                    if (request.getMonitorIds() != null && !request.getMonitorIds().isEmpty()) {
                        return saveMonitorsForOffer(savedOffer.getId(), request.getMonitorIds())
                                .then(toDtoMono(savedOffer));
                    }
                    return toDtoMono(savedOffer);
                });
    }

    public Flux<SchoolDto.OfferDto> findBySchoolId(UUID schoolId) {
        return offerRepository.findBySchoolId(schoolId)
                .flatMap(this::toDtoMono);
    }

    public Mono<SchoolDto.OfferDto> findById(UUID id) {
        return offerRepository.findById(id)
                .flatMap(this::toDtoMono);
    }

    @Transactional
    public Mono<SchoolDto.OfferDto> update(UUID schoolId, UUID id, UpdateOfferRequest request) {
        return offerRepository.findById(id)
                .filter(offer -> schoolId.equals(offer.getSchoolId()))
                .flatMap(offer -> {
                    if (request.getName() != null)
                        offer.setName(request.getName());
                    if (request.getDescription() != null)
                        offer.setDescription(request.getDescription());
                    if (request.getPrice() != null)
                        offer.setPrice(request.getPrice());
                    if (request.getHours() != null)
                        offer.setHours(request.getHours());
                    if (request.getPermitType() != null)
                        offer.setPermitType(request.getPermitType());
                    if (request.getImageUrl() != null)
                        offer.setImageUrl(request.getImageUrl());
                    return offerRepository.save(offer);
                })
                .flatMap(savedOffer -> {
                    if (request.getMonitorIds() != null) {
                        return offerMonitorRepository.deleteByOfferId(savedOffer.getId())
                                .then(saveMonitorsForOffer(savedOffer.getId(), request.getMonitorIds()))
                                .then(toDtoMono(savedOffer));
                    }
                    return toDtoMono(savedOffer);
                });
    }

    @Transactional
    public Mono<Void> delete(UUID schoolId, UUID id) {
        return offerRepository.findById(id)
                .filter(offer -> schoolId.equals(offer.getSchoolId()))
                .flatMap(offer -> offerMonitorRepository.deleteByOfferId(offer.getId())
                        .then(offerRepository.delete(offer)));
    }

    private Mono<Void> saveMonitorsForOffer(UUID offerId, List<UUID> monitorIds) {
        if (monitorIds == null || monitorIds.isEmpty()) return Mono.empty();
        
        return Flux.fromIterable(monitorIds)
                .map(monitorId -> OfferMonitor.builder()
                        .offerId(offerId)
                        .monitorId(monitorId)
                        .createdAt(LocalDateTime.now())
                        .build())
                .flatMap(offerMonitorRepository::save)
                .then();
    }

    private Mono<SchoolDto.OfferDto> toDtoMono(Offer offer) {
        return offerMonitorRepository.findByOfferId(offer.getId())
                .map(OfferMonitor::getMonitorId)
                .collectList()
                .map(monitorIds -> SchoolDto.OfferDto.builder()
                        .id(offer.getId())
                        .name(offer.getName())
                        .description(offer.getDescription())
                        .price(offer.getPrice())
                        .hours(offer.getHours())
                        .permitType(offer.getPermitType())
                        .imageUrl(offer.getImageUrl())
                        .monitorIds(monitorIds)
                        .build());
    }
}
