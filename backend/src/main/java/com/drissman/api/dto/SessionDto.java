package com.drissman.api.dto;

import com.drissman.domain.entity.Session.SessionStatus;
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
public class SessionDto {
    private UUID id;
    private UUID enrollmentId;
    private UUID monitorId;
    private UUID moduleId;
    private UUID lessonId;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private SessionStatus status;
    private String meetingPoint;
    private String pedagogicalNotes;
    private int durationHours;
}
