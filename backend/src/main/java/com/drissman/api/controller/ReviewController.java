package com.drissman.api.controller;

import com.drissman.api.dto.CreateReviewRequest;
import com.drissman.api.dto.ReviewDto;
import com.drissman.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Create a review (one per user per school).
     * Uses JWT Principal instead of X-User-Id header.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ReviewDto> create(
            Principal principal,
            @Valid @RequestBody CreateReviewRequest request) {
        if (principal == null) {
            return Mono.error(new RuntimeException("Authentification requise pour laisser un avis"));
        }
        UUID userId = UUID.fromString(principal.getName());
        return reviewService.create(userId, request);
    }

    /**
     * Get all reviews for a school
     */
    @GetMapping("/school/{schoolId}")
    public Flux<ReviewDto> getBySchool(@PathVariable UUID schoolId) {
        return reviewService.findBySchoolId(schoolId);
    }

}
