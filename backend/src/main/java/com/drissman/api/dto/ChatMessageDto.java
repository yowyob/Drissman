package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private UUID id;
    private UUID senderId;
    private UUID recipientId;
    private UUID offerId;
    private String content;
    private Boolean isRead;
    private Boolean isMe;
    private String time;
    private LocalDateTime createdAt;
}
