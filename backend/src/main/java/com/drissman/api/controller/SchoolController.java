package com.drissman.api.controller;

import com.drissman.api.dto.SchoolDto;
import com.drissman.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/schools")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    @GetMapping
    public Flux<SchoolDto> getAll(@RequestParam(required = false) String city) {
        return schoolService.findAll(city);
    }

    /**
     * Search schools near a GPS coordinate (Haversine formula).
     * Example: GET /api/schools/nearby?lat=4.05&lng=9.7&radius=10
     */
    @GetMapping("/nearby")
    public Flux<SchoolDto> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "10") double radius) {
        return schoolService.findNearby(lat, lng, radius);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<SchoolDto>> getById(@PathVariable UUID id) {
        return schoolService.findById(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
