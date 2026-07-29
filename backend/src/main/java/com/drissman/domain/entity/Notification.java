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
@Table("notifications")
public class Notification {
    @Id
    private UUID id;

    @Column("user_id")
    private UUID userId;

    private String title;

    private String message;

    private String type;

    @Column("is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column("created_at")
    private LocalDateTime createdAt;
}
