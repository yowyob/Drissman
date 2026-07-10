package com.drissman.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("lesson_registrations")
public class LessonRegistration {

    @Id
    private UUID id;

    @Column("lesson_id")
    private UUID lessonId;

    @Column("student_id")
    private UUID studentId;

    private RegistrationStatus status;

    @Column("attended_at")
    private LocalDateTime attendedAt;

    private String notes;

    @Column("created_at")
    private LocalDateTime createdAt;

    public enum RegistrationStatus {
        REGISTERED,
        ATTENDED,
        ABSENT,
        CANCELLED
    }
}
