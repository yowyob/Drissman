package com.drissman.api.controller;

import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import com.drissman.api.dto.OfferModuleDto;
import com.drissman.api.dto.SchoolDto;
import com.drissman.service.OfferModuleService;
import com.drissman.service.OfferService;
import lombok.RequiredArgsConstructor;

import java.util.UUID;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;
    private final OfferModuleService offerModuleService;

    /**
     * Get all offers for a school
     */
    @GetMapping("/school/{schoolId}")
    public Flux<SchoolDto.OfferDto> getBySchool(@PathVariable UUID schoolId) {
        return offerService.findBySchoolId(schoolId);
    }

    /**
     * Get offer by ID
     */
    @GetMapping("/{id}")
    public Mono<SchoolDto.OfferDto> getById(@PathVariable UUID id) {
        return offerService.findById(id);
    }

    // ─── Module association endpoints ───────────────────────────────────

    /**
     * Get all modules for an offer, ordered by orderIndex.
     */
    @GetMapping("/{offerId}/modules")
    public Flux<OfferModuleDto> getModules(@PathVariable UUID offerId) {
        return offerModuleService.getModulesForOffer(offerId);
    }

}
