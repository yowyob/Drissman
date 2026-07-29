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
@Table("session_course_offers")
public class SessionCourseOffer {

    @Id
    private UUID id;

    @Column("session_id")
    private UUID sessionId;

    @Column("offer_id")
    private UUID offerId;

    @Column("created_at")
    private LocalDateTime createdAt;
}
