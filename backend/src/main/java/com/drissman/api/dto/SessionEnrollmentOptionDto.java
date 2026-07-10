package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionEnrollmentOptionDto {
    private UUID enrollmentId;
    private UUID studentId;
    private String studentName;
    private String status;
    private Integer hoursPurchased;
    private Integer hoursConsumed;
}
