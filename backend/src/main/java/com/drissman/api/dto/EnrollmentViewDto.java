package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentViewDto {
    private UUID id;
    private UUID offerId;
    private String offerName;
    private Integer price;
    private Integer hours;
    private Integer hoursConsumed;
    private Integer hoursRemaining;
    private String permitType;

    private UUID schoolId;
    private String schoolName;

    private UUID studentId;
    private String studentName;

    private String status;
    private LocalDateTime enrolledAt;
}
