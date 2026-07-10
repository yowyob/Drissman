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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("lessons")
public class Lesson {

    @Id
    private UUID id;

    @Column("school_id")
    private UUID schoolId;

    @Column("monitor_id")
    private UUID monitorId;

    private LocalDate date;

    @Column("start_time")
    private LocalTime startTime;

    @Column("end_time")
    private LocalTime endTime;

    private String topic;

    @Column("lesson_type")
    private LessonType lessonType;

    @Column("module_id")
    private UUID moduleId;

    @Column("training_period_id")
    private UUID trainingPeriodId;

    private String description;

    @Column("room_id")
    private String roomId;

    private Integer capacity;

    private LessonStatus status;

    @Column("created_at")
    private LocalDateTime createdAt;

    public enum LessonStatus {
        SCHEDULED,
        CANCELLED,
        COMPLETED
    }

    public enum LessonType {
        CODE,
        CONDUITE,
        EXAMEN_BLANC
    }
}
