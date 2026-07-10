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
@Table("reviews")
public class Review {

    @Id
    private UUID id;

    @Column("user_id")
    private UUID userId;

    @Column("school_id")
    private UUID schoolId;

    private Integer rating; // 1-5

    private String comment;

    private Boolean verified;

    @Column("created_at")
    private LocalDateTime createdAt;
}
