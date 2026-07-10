package com.drissman.api.controller;

import com.drissman.api.dto.CreateTrainingPeriodRequest;
import com.drissman.api.dto.TrainingPeriodViewDto;
import com.drissman.api.dto.UpdateTrainingPeriodStatusRequest;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import com.drissman.service.TrainingPeriodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/schools/admin/training-periods")
@RequiredArgsConstructor
public class AdminTrainingPeriodController {

    private final TrainingPeriodService trainingPeriodService;
    private final UserRepository userRepository;

    @GetMapping
    public Flux<TrainingPeriodViewDto> list(Principal principal) {
        return getSchoolId(principal).flatMapMany(trainingPeriodService::getBySchool);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<TrainingPeriodViewDto> create(
            Principal principal,
            @Valid @RequestBody CreateTrainingPeriodRequest request) {
        return getSchoolId(principal).flatMap(schoolId -> trainingPeriodService.create(schoolId, request));
    }

    @PatchMapping("/{id}/status")
    public Mono<TrainingPeriodViewDto> updateStatus(
            Principal principal,
            @PathVariable UUID id,
            @RequestBody UpdateTrainingPeriodStatusRequest request) {
        return getSchoolId(principal).flatMap(schoolId -> trainingPeriodService.updateStatus(schoolId, id, request.getStatus()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(
            Principal principal,
            @PathVariable UUID id) {
        return getSchoolId(principal).flatMap(schoolId -> trainingPeriodService.delete(schoolId, id));
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
