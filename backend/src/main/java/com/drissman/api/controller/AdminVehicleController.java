package com.drissman.api.controller;

import com.drissman.api.dto.VehicleDto;
import com.drissman.domain.entity.User;
import com.drissman.domain.entity.VehiclePosition;
import com.drissman.domain.repository.UserRepository;
import com.drissman.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/schools/admin/vehicles")
@RequiredArgsConstructor
public class AdminVehicleController {

    private final VehicleService vehicleService;
    private final UserRepository userRepository;

    @GetMapping
    public Flux<VehicleDto> list(Principal principal) {
        return getSchoolId(principal).flatMapMany(vehicleService::getForSchool);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<VehicleDto> create(Principal principal, @RequestBody VehicleDto request) {
        return getSchoolId(principal).flatMap(schoolId -> vehicleService.create(schoolId, request));
    }

    @PutMapping("/{vehicleId}")
    public Mono<VehicleDto> update(Principal principal, @PathVariable UUID vehicleId,
            @RequestBody VehicleDto request) {
        return getSchoolId(principal).flatMap(schoolId -> vehicleService.update(schoolId, vehicleId, request));
    }

    @DeleteMapping("/{vehicleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deactivate(Principal principal, @PathVariable UUID vehicleId) {
        return getSchoolId(principal).flatMap(schoolId -> vehicleService.deactivate(schoolId, vehicleId));
    }

    @GetMapping("/{vehicleId}/history")
    public Flux<VehiclePosition> history(Principal principal, @PathVariable UUID vehicleId,
            @RequestParam(defaultValue = "100") int limit) {
        return getSchoolId(principal).flatMapMany(schoolId -> vehicleService.getHistory(schoolId, vehicleId, limit));
    }

    private Mono<UUID> getSchoolId(Principal principal) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }
        return userRepository.findById(UUID.fromString(principal.getName()))
                .map(User::getSchoolId)
                .filter(schoolId -> schoolId != null)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Compte non associé à une école")));
    }
}
