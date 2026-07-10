package com.drissman.api.controller;

import com.drissman.api.dto.CreateOfferRequest;
import com.drissman.api.dto.OfferModuleDto;
import com.drissman.api.dto.SchoolDto;
import com.drissman.api.dto.SetOfferModulesRequest;
import com.drissman.api.dto.UpdateOfferRequest;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import com.drissman.service.OfferModuleService;
import com.drissman.service.OfferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/schools/admin/offers")
@RequiredArgsConstructor
public class AdminOfferController {

    private final OfferService offerService;
    private final OfferModuleService offerModuleService;
    private final UserRepository userRepository;

    @GetMapping
    public Flux<SchoolDto.OfferDto> getOffers(Principal principal) {
        return getSchoolId(principal)
                .flatMapMany(offerService::findBySchoolId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<SchoolDto.OfferDto> create(
            Principal principal,
            @Valid @RequestBody CreateOfferRequest request) {
        return getSchoolId(principal)
                .flatMap(schoolId -> offerService.create(schoolId, request));
    }

    @PatchMapping("/{id}")
    public Mono<SchoolDto.OfferDto> update(
            Principal principal,
            @PathVariable UUID id,
            @RequestBody UpdateOfferRequest request) {
        return getSchoolId(principal)
                .flatMap(schoolId -> offerService.update(schoolId, id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(
            Principal principal,
            @PathVariable UUID id) {
        return getSchoolId(principal)
                .flatMap(schoolId -> offerService.delete(schoolId, id));
    }

    @PutMapping("/{offerId}/modules")
    public Flux<OfferModuleDto> setModules(
            Principal principal,
            @PathVariable UUID offerId,
            @RequestBody SetOfferModulesRequest request) {
        return getSchoolId(principal)
                .flatMapMany(schoolId -> offerModuleService.setModulesForOffer(schoolId, offerId, request));
    }

    @DeleteMapping("/{offerId}/modules/{moduleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> removeModule(
            Principal principal,
            @PathVariable UUID offerId,
            @PathVariable UUID moduleId) {
        return getSchoolId(principal)
                .flatMap(schoolId -> offerModuleService.removeModuleFromOffer(schoolId, offerId, moduleId));
    }

    private Mono<UUID> getSchoolId(Principal principal) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }

        return userRepository.findById(UUID.fromString(principal.getName()))
                .map(User::getSchoolId)
                .filter(schoolId -> schoolId != null)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Compte non associe a une ecole")));
    }
}
