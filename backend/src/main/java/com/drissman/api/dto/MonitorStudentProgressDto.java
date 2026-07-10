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
public class MonitorStudentProgressDto {
    private UUID enrollmentId;
    private UUID studentId;
    private String studentName;
    private UUID offerId;
    private String offerName;
    private Integer hoursPurchased;
    private Integer hoursConsumed;
    private Integer hoursRemaining;
    private String status;
}
