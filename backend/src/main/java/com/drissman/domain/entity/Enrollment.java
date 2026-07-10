package com.drissman.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Enrollment entity - The "client file" with hour credits.
 * Maps to UML class: Inscription
 * 
 * An Enrollment represents a student's subscription to an offer,
 * tracking purchased hours and consumed hours.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("enrollments")
public class Enrollment {

    @Id
    private UUID id;

    @Column("user_id")
    private UUID userId;

    @Column("school_id")
    private UUID schoolId;

    @Column("offer_id")
    private UUID offerId;

    @Column("training_period_id")
    private UUID trainingPeriodId;

    @Column("enrolled_at")
    private LocalDateTime enrolledAt;

    private EnrollmentStatus status;

    @Column("hours_purchased")
    private Integer hoursPurchased;

    @Column("hours_consumed")
    @Builder.Default
    private Integer hoursConsumed = 0;

    @Column("created_at")
    private LocalDateTime createdAt;

    public enum EnrollmentStatus {
        PENDING,
        ACTIVE,
        SUSPENDED,
        COMPLETED,
        CANCELLED
    }

    /**
     * Calculate remaining hours available for booking sessions.
     */
    public Integer getRemainingHours() {
        return hoursPurchased - hoursConsumed;
    }
}
