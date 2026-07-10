package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerStatsDto {
    private String revenue;
    private int enrollments;
    private String successRate;
    private int upcomingLessons;
    private double revenueGrowth;
    private int enrollmentGrowth;
}
