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
@Table("chat_messages")
public class ChatMessage {

    @Id
    private UUID id;

    @Column("sender_id")
    private UUID senderId;

    @Column("recipient_id")
    private UUID recipientId;

    @Column("offer_id")
    private UUID offerId;

    private String content;

    @Column("is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column("created_at")
    private LocalDateTime createdAt;
}
