package com.drissman.service;

import com.drissman.api.dto.CreateReviewRequest;
import com.drissman.api.dto.ReviewDto;
import com.drissman.domain.entity.Enrollment;
import com.drissman.domain.entity.Review;
import com.drissman.domain.repository.EnrollmentRepository;
import com.drissman.domain.repository.ReviewRepository;
import com.drissman.domain.repository.SchoolRepository;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

        private final ReviewRepository reviewRepository;
        private final UserRepository userRepository;
        private final SchoolRepository schoolRepository;
        private final EnrollmentRepository enrollmentRepository;

        public Mono<ReviewDto> create(UUID userId, CreateReviewRequest request) {
                log.info("Creating review for user {} and school {}. Rating: {}", userId, request.getSchoolId(),
                                request.getRating());

                // 1. Verify user has an active/completed enrollment with this school
                return enrollmentRepository.findByUserId(userId)
                                .collectList()
                                .flatMap(enrollments -> {
                                        log.info("Found {} enrollments for user {}", enrollments.size(), userId);

                                        boolean hasValidEnrollment = enrollments.stream()
                                                        .anyMatch(enrollment -> enrollment.getSchoolId()
                                                                        .equals(request.getSchoolId()) &&
                                                                        (enrollment.getStatus() == Enrollment.EnrollmentStatus.ACTIVE
                                                                                        ||
                                                                                        enrollment.getStatus() == Enrollment.EnrollmentStatus.COMPLETED));

                                        if (!hasValidEnrollment) {
                                                log.warn("Review rejected: No active/completed enrollment found for user {} and school {}",
                                                                userId, request.getSchoolId());
                                                return Mono.error(new RuntimeException(
                                                                "Vous devez avoir une inscription active pour laisser un avis."));
                                        }

                                        // 2. Check if user already reviewed this school
                                        return reviewRepository.findByUserIdAndSchoolId(userId, request.getSchoolId())
                                                        .flatMap(existing -> {
                                                                log.warn("Review rejected: User {} already reviewed school {}",
                                                                                userId, request.getSchoolId());
                                                                return Mono.<ReviewDto>error(new RuntimeException(
                                                                                "Vous avez déjà laissé un avis pour cette auto-école."));
                                                        })
                                                        .switchIfEmpty(Mono.defer(() -> {
                                                                log.info("Saving new review for user {} and school {}",
                                                                                userId, request.getSchoolId());
                                                                Review review = Review.builder()
                                                                                .userId(userId)
                                                                                .schoolId(request.getSchoolId())
                                                                                .rating(request.getRating())
                                                                                .comment(request.getComment())
                                                                                .verified(false)
                                                                                .build();

                                                                return reviewRepository.save(review)
                                                                                .flatMap(saved -> {
                                                                                        log.info("Review saved successfully: {}",
                                                                                                        saved.getId());
                                                                                        return enrichWithUserName(saved)
                                                                                                        .flatMap(dto -> updateSchoolRating(
                                                                                                                        request.getSchoolId())
                                                                                                                        .thenReturn(dto));
                                                                                });
                                                        }));
                                });
        }

        public Flux<ReviewDto> findBySchoolId(UUID schoolId) {
                return reviewRepository.findBySchoolId(schoolId)
                                .flatMap(this::enrichWithUserName);
        }

        public Mono<ReviewDto> verifyReview(UUID reviewId) {
                return reviewRepository.findById(reviewId)
                                .flatMap(review -> {
                                        review.setVerified(true);
                                        return reviewRepository.save(review);
                                })
                                .flatMap(this::enrichWithUserName);
        }

        public Mono<Void> delete(UUID reviewId) {
                return reviewRepository.findById(reviewId)
                                .flatMap(review -> reviewRepository.deleteById(reviewId)
                                                .then(updateSchoolRating(review.getSchoolId())));
        }

        private Mono<ReviewDto> enrichWithUserName(Review review) {
                return userRepository.findById(review.getUserId())
                                .map(user -> ReviewDto.builder()
                                                .id(review.getId())
                                                .userId(review.getUserId())
                                                .userName(user.getFirstName() + " " +
                                                                (user.getLastName() != null && !user.getLastName()
                                                                                .isEmpty() ? user.getLastName()
                                                                                                .charAt(0) + "." : ""))
                                                .schoolId(review.getSchoolId())
                                                .rating(review.getRating())
                                                .comment(review.getComment())
                                                .verified(review.getVerified())
                                                .createdAt(review.getCreatedAt())
                                                .build())
                                .switchIfEmpty(Mono.just(ReviewDto.builder()
                                                .id(review.getId())
                                                .userId(review.getUserId())
                                                .userName("Anonyme")
                                                .schoolId(review.getSchoolId())
                                                .rating(review.getRating())
                                                .comment(review.getComment())
                                                .verified(review.getVerified())
                                                .createdAt(review.getCreatedAt())
                                                .build()));
        }

        private Mono<Void> updateSchoolRating(UUID schoolId) {
                return reviewRepository.getAverageRatingBySchoolId(schoolId)
                                .flatMap(avgRating -> schoolRepository.findById(schoolId)
                                                .flatMap(school -> {
                                                        school.setRating(BigDecimal.valueOf(avgRating));
                                                        return schoolRepository.save(school);
                                                }))
                                .then();
        }
}
