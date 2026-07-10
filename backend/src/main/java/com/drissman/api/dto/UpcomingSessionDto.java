package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingSessionDto {
    private String id;
    private String monitorName;
    private String studentName;
    private LocalDate date;
    private String startTime;
    private String endTime;
    private String meetingPoint;
    private String status;
}
