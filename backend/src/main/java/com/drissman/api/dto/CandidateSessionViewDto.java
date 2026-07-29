package com.drissman.api.dto;

import com.drissman.domain.entity.Session;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateSessionViewDto {
    private UUID sessionId;
    private UUID enrollmentId;
    private UUID offerId;
    private String offerName;
    private String schoolName;
    private String monitorName;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String meetingPoint;
    private Session.SessionStatus status;
    private int durationHours;
}
