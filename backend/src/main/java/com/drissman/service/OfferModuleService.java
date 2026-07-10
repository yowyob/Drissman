package com.drissman.service;

import com.drissman.api.dto.OfferModuleDto;
import com.drissman.api.dto.SetOfferModulesRequest;
import com.drissman.domain.entity.OfferModule;
import com.drissman.domain.repository.OfferRepository;
import com.drissman.domain.repository.ModuleRepository;
import com.drissman.domain.repository.OfferModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OfferModuleService {

    private final OfferModuleRepository offerModuleRepository;
    private final ModuleRepository moduleRepository;
    private final OfferRepository offerRepository;

    /**
     * Get all modules for an offer, enriched with module details.
     */
    public Flux<OfferModuleDto> getModulesForOffer(UUID offerId) {
        return offerModuleRepository.findByOfferIdOrderByOrderIndexAsc(offerId)
                .flatMap(om -> moduleRepository.findById(om.getModuleId())
                        .map(module -> OfferModuleDto.builder()
                                .id(om.getId())
                                .offerId(om.getOfferId())
                                .moduleId(om.getModuleId())
                                .orderIndex(om.getOrderIndex())
                                .moduleName(module.getName())
                                .moduleCategory(module.getCategory() != null ? module.getCategory().name() : null)
                                .moduleDescription(module.getDescription())
                                .moduleRequiredHours(module.getRequiredHours())
                                .build()));
    }

    /**
     * Replace the entire module list for an offer (delete all, then insert new
     * list).
     */
    public Flux<OfferModuleDto> setModulesForOffer(UUID schoolId, UUID offerId, SetOfferModulesRequest request) {
        return offerRepository.findById(offerId)
                .filter(offer -> schoolId.equals(offer.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Offre introuvable pour cette auto-ecole")))
                .then(offerModuleRepository.deleteByOfferId(offerId))
                .thenMany(Flux.fromIterable(request.getModules())
                        .index()
                        .flatMap(indexed -> {
                            SetOfferModulesRequest.ModuleEntry entry = indexed.getT2();
                            int order = entry.getOrderIndex() != null
                                    ? entry.getOrderIndex()
                                    : indexed.getT1().intValue();
                            OfferModule om = OfferModule.builder()
                                    .offerId(offerId)
                                    .moduleId(entry.getModuleId())
                                    .orderIndex(order)
                                    .createdAt(LocalDateTime.now())
                                    .build();
                            return offerModuleRepository.save(om);
                        }))
                .thenMany(getModulesForOffer(offerId));
    }

    /**
     * Add a single module to an offer.
     */
    public Mono<OfferModuleDto> addModuleToOffer(UUID offerId, UUID moduleId, Integer orderIndex) {
        OfferModule om = OfferModule.builder()
                .offerId(offerId)
                .moduleId(moduleId)
                .orderIndex(orderIndex != null ? orderIndex : 0)
                .createdAt(LocalDateTime.now())
                .build();
        return offerModuleRepository.save(om)
                .flatMap(saved -> moduleRepository.findById(saved.getModuleId())
                        .map(module -> OfferModuleDto.builder()
                                .id(saved.getId())
                                .offerId(saved.getOfferId())
                                .moduleId(saved.getModuleId())
                                .orderIndex(saved.getOrderIndex())
                                .moduleName(module.getName())
                                .moduleCategory(module.getCategory() != null ? module.getCategory().name() : null)
                                .moduleDescription(module.getDescription())
                                .moduleRequiredHours(module.getRequiredHours())
                                .build()));
    }

    /**
     * Remove a module from an offer.
     */
    public Mono<Void> removeModuleFromOffer(UUID schoolId, UUID offerId, UUID moduleId) {
        return offerRepository.findById(offerId)
                .filter(offer -> schoolId.equals(offer.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Offre introuvable pour cette auto-ecole")))
                .then(offerModuleRepository.findByOfferIdAndModuleId(offerId, moduleId))
                .flatMap(offerModuleRepository::delete);
    }
}
