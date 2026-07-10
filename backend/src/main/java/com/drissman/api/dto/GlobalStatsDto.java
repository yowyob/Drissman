package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalStatsDto {
    private long totalUsers;
    private long totalSchools;
    private long pendingSchools;
    private long totalEnrollments;
    private long totalRevenue;

    private Map<String, Long> usersByRole;
    private Map<String, Long> enrollmentsByStatus;
    private List<MonthlyRevenue> revenueByMonth;
    private List<SchoolRegistrationTrend> schoolsTrend;

    private List<RecentActivityDto> recentActivities;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenue {
        private String month;
        private long revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SchoolRegistrationTrend {
        private String month;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityDto {
        private String type; // "SCHOOL", "INVOICE", "ENROLLMENT"
        private String description;
        private String timestamp;
        private String status;
        private String schoolName;
        private String resourceId;
    }
}
