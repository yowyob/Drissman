package com.drissman.api.controller;

import com.drissman.api.dto.CreateModuleRequest;
import com.drissman.api.dto.ModuleDto;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import com.drissman.service.ModuleService;
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
@RequestMapping("/api/schools/admin/modules")
@RequiredArgsConstructor
public class AdminModuleController {

    private final ModuleService moduleService;
    private final UserRepository userRepository;

    @GetMapping
    public Flux<ModuleDto> getModules(Principal principal) {
        return getSchoolId(principal)
                .flatMapMany(moduleService::getModules);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ModuleDto> createModule(@Valid @RequestBody CreateModuleRequest request, Principal principal) {
        return getSchoolId(principal)
                .flatMap(schoolId -> moduleService.createModule(schoolId, request));
    }

    @PutMapping("/{moduleId}")
    public Mono<ModuleDto> updateModule(@PathVariable UUID moduleId,
            @Valid @RequestBody CreateModuleRequest request,
            Principal principal) {
        return getSchoolId(principal)
                .flatMap(schoolId -> moduleService.updateModule(moduleId, schoolId, request));
    }

    @DeleteMapping("/{moduleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteModule(@PathVariable UUID moduleId, Principal principal) {
        return getSchoolId(principal)
                .flatMap(schoolId -> moduleService.deleteModule(moduleId, schoolId));
    }

    private Mono<UUID> getSchoolId(Principal principal) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }
        return userRepository.findById(UUID.fromString(principal.getName()))
                .map(User::getSchoolId)
                .filter(schoolId -> schoolId != null)
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.BAD_REQUEST, "Utilisateur non associe a une ecole")));
    }
}
