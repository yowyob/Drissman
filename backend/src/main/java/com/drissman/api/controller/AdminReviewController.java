package com.drissman.api.controller;

import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import com.drissman.api.dto.ReviewDto;
import com.drissman.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import java.util.UUID;

@RestController
@RequestMapping("/api/schools/admin/reviews")
@RequiredArgsConstructor
@Slf4j
public class AdminReviewController {

    private final ReviewService reviewService;

    /**
     * Verify a review (admin only)
     */
    @PatchMapping("/{id}/verify")
    public Mono<ReviewDto> verify(@PathVariable UUID id) {
        return reviewService.verifyReview(id);
    }

    /**
     * Delete a review
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable UUID id) {
        return reviewService.delete(id);
    }
}
