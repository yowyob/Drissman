package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {
    private Integer activeCandidates;
    private Integer totalOffers;
    private Integer totalModules;
    private Integer todaySessions;
    private Long totalRevenue;
    private Long monthlyRevenue;
    private Integer pendingValidations;
    private List<RecentActivityDto> recentActivities;
    private List<UpcomingSessionDto> upcomingSessions;
}
