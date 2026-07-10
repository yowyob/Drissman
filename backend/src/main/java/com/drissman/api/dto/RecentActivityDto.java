package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityDto {
    private String id;
    private String title;
    private String description;
    private String type; // e.g. "ENROLLMENT", "SESSION_COMPLETED"
    private LocalDateTime timestamp;
}
