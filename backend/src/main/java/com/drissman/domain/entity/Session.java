package com.drissman.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Session entity - A scheduled driving lesson.
 * Maps to UML class: Séance
 * 
 * A Session is part of an Enrollment (composition) and may be
 * assigned to a Monitor. It represents 1h or 2h of driving practice.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("sessions")
public class Session {

    @Id
    private UUID id;

    @Column("enrollment_id")
    private UUID enrollmentId;

    @Column("school_id")
    private UUID schoolId;

    @Column("monitor_id")
    private UUID monitorId; // Can be null if not yet assigned

    @Column("module_id")
    private UUID moduleId;

    @Column("lesson_id")
    private UUID lessonId;

    private LocalDate date;

    @Column("start_time")
    private LocalTime startTime;

    @Column("end_time")
    private LocalTime endTime;

    private SessionStatus status;

    @Column("meeting_point")
    private String meetingPoint;

    @Column("pedagogical_notes")
    private String pedagogicalNotes;

    @Column("created_at")
    private LocalDateTime createdAt;

    /** Version optimiste du mode hors ligne : horodatage de dernière modification. */
    @Column("updated_at")
    private LocalDateTime updatedAt;

    public enum SessionStatus {
        SCHEDULED,
        CONFIRMED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        NO_SHOW
    }

    /**
     * Calculate the duration of this session in minutes.
     */
    public int getDurationMinutes() {
        if (startTime == null || endTime == null)
            return 0;
        return (int) java.time.Duration.between(startTime, endTime).toMinutes();
    }

    /**
     * Calculate the duration of this session in hours.
     */
    public int getDurationHours() {
        if (startTime == null || endTime == null)
            return 1;
        long minutes = java.time.Duration.between(startTime, endTime).toMinutes();
        int hours = (int) Math.round(minutes / 60.0);
        return Math.max(1, hours);
    }
}
