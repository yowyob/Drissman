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
public class NotificationDto {
    private String id;
    private String title;
    private String message;
    private String type;
    private boolean read;
    private String date; // formatted date or iso string
}
